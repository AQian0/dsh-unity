/**
 * Per-agent skill provider registry.
 *
 * A bundle row lands in the harness's global scope layer, while an agent preset
 * mounts its own skill provider in the agent's layer — and the nearest layer wins
 * a duplicate name outright, regardless of rank. Registering from a bundle row
 * alone therefore loses to whatever the preset already sees, and cannot vary by
 * project. Registering through `agent.ctx` instead places this provider in that
 * agent's layer: it wins the names it owns, and its catalog can depend on the
 * project the agent is actually working in.
 *
 * This module keeps that bookkeeping: one shared reader and parse cache, one fact
 * cache per working directory, and one registration per live agent. The DSH skill
 * registry caches a completed catalog per cwd, scope chain, and revision, so a
 * changed editor version or package list is only noticed when the provider calls
 * `control.invalidate()`. Relying on `list()` alone would therefore miss every
 * change that happens while the catalog cache is warm; each registration runs a
 * cheap `agent/pre-step` fingerprint check instead, and re-gates only when one of
 * the three files that decide the facts actually moved.
 *
 * @module dsh-unity/lib/registry
 */

import { detectProject, factsKey, projectFingerprint, readProjectSkillNames } from './project.ts';
import type { DetectOptions, ProjectFacts } from './project.ts';
import { gateCatalog, renderContext } from './gating.ts';
import type { GatedCatalog, HiddenSkill } from './gating.ts';
import { createUnitySkillReader } from './skills.ts';
import type { ReaderOptions, UnitySkillReader } from './skills.ts';
import type {
  AgentLike,
  PluginContext,
  SessionLike,
  SkillCandidate,
  SkillLookupOptions,
  SkillProvider,
  SkillProviderControl,
  SkillsService,
  SubprocessService,
  SystemPromptService,
  WorkingDirectoryService,
} from './harness.ts';

/** How long detected project facts stay fresh before they are read again. */
export const FACTS_TTL_MS = 2000;

/** How long a `unity` CLI lookup stays fresh. */
export const CLI_TTL_MS = 60_000;

/** How often a session outside a project re-checks whether one appeared. */
const PROJECT_APPEARED_RECHECK_MS = 10_000;

/** Upper bound on the per-cwd fact and project-skill caches. */
const MAX_CACHE_ENTRIES = 64;

/** Prompt order for the contributed Unity context: after policies, before harness source. */
const CONTEXT_ORDER = 180;

/** Settings the registry needs; the plugin entry point supplies them. */
export interface RegistrySettings {
  readonly skillDir: string;
  readonly providerName: string;
  readonly source: string;
  readonly rank: number;
  readonly exclude: ReadonlySet<string>;
  readonly respectProjectRoots: boolean;
  readonly injectContext: boolean;
  readonly workspaceSkills: ReadonlySet<string>;
  readonly gateByProject: boolean;
  readonly enforceRequirements: boolean;
  readonly parseCache: ReaderOptions['parseCache'];
}

/** One live agent's registration. */
interface Registration {
  readonly id: string;
  readonly agent: AgentLike;
  cwd: string | undefined;
  control: SkillProviderControl | undefined;
  facts: ProjectFacts | undefined;
  hidden: readonly HiddenSkill[];
  lastKey: string;
  fingerprint: string;
  lastCheckAt: number;
  disposers: Array<() => void>;
}

/** Options for {@link createAgentRegistry}. */
export interface RegistryOptions {
  readonly ctx: PluginContext;
  readonly settings: RegistrySettings;
  readonly reader?: UnitySkillReader;
  readonly detect?: (cwd: string, signal?: AbortSignal) => Promise<ProjectFacts | undefined>;
  readonly readProjectSkills?: (roots: readonly string[]) => Promise<Set<string>>;
}

/** The result of trying to register one agent. */
export type RegistrationResult = 'registered' | 'unavailable' | 'skipped';

/** The registry handed to the plugin entry point. */
export interface AgentRegistry {
  readonly reader: UnitySkillReader;
  size(): number;
  add(agent: AgentLike | undefined): Promise<RegistrationResult>;
  remove(agent: AgentLike | undefined): void;
  factsFor(cwd: string | undefined, signal?: AbortSignal): Promise<ProjectFacts | undefined>;
  projectSkillsFor(facts: ProjectFacts | undefined): Promise<Set<string>>;
  invalidateAll(): void;
  disposeAll(): void;
}

/** Keep a bounded insertion-ordered map: the oldest entry leaves first. */
function remember<K, V>(map: Map<K, V>, key: K, value: V): V {
  if (!map.has(key) && map.size >= MAX_CACHE_ENTRIES) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
  map.set(key, value);
  return value;
}

/** Whether a rejected promise is an abort, which callers let through. */
function isAbort(error: unknown): boolean {
  return (error as { name?: unknown } | undefined)?.name === 'AbortError';
}

/**
 * Create the registry that owns every per-agent registration.
 *
 * @param options - registry settings and injectable collaborators.
 * @returns the registry.
 */
export function createAgentRegistry(options: RegistryOptions): AgentRegistry {
  const { ctx, settings } = options;
  const skillReader =
    options.reader ??
    createUnitySkillReader({
      skillDir: settings.skillDir,
      providerName: settings.providerName,
      source: settings.source,
      rank: settings.rank,
      exclude: settings.exclude,
      parseCache: settings.parseCache,
      logger: ctx.logger,
    });

  const detectProjectFacts =
    options.detect ?? ((cwd: string, signal?: AbortSignal) => detectProject(cwd, resolveDetectOptions(ctx, signal)));
  const readOverrides = options.readProjectSkills ?? ((roots: readonly string[]) => readProjectSkillNames(roots));

  const factsByCwd = new Map<string, { facts: ProjectFacts | undefined; at: number }>();
  const overridesByRoot = new Map<string, { names: Set<string>; at: number }>();
  const states = new Map<string, Registration>();

  async function factsFor(
    cwd: string | undefined,
    signal?: AbortSignal,
    force = false,
  ): Promise<ProjectFacts | undefined> {
    if (typeof cwd !== 'string' || cwd === '') return undefined;
    const cached = factsByCwd.get(cwd);
    const now = Date.now();
    if (!force && cached !== undefined && now - cached.at < FACTS_TTL_MS) return cached.facts;
    let facts: ProjectFacts | undefined;
    try {
      facts = await detectProjectFacts(cwd, signal);
    } catch (error) {
      if (isAbort(error) || signal?.aborted === true) throw error;
      ctx.logger.warn(`unity skills: project detection failed for ${cwd}: ${String(error)}`);
      facts = undefined;
    }
    remember(factsByCwd, cwd, { facts, at: now });
    return facts;
  }

  async function overridesFor(facts: ProjectFacts | undefined): Promise<Set<string>> {
    if (facts === undefined || !settings.respectProjectRoots) return new Set<string>();
    const key = `${facts.dshRoot}\u0000${facts.root}`;
    const cached = overridesByRoot.get(key);
    const now = Date.now();
    if (cached !== undefined && now - cached.at < FACTS_TTL_MS) return cached.names;
    let names: Set<string>;
    try {
      names = await readOverrides([facts.dshRoot, facts.root]);
    } catch {
      names = new Set<string>();
    }
    remember(overridesByRoot, key, { names, at: now });
    return names;
  }

  /** Compute the gated catalog for one working directory. */
  async function view(
    cwd: string | undefined,
    lookup: SkillLookupOptions,
    force = false,
  ): Promise<GatedCatalog & { facts: ProjectFacts | undefined; key: string }> {
    const facts = await factsFor(cwd, lookup.signal, force);
    const projectSkills = await overridesFor(facts);
    const candidates = await skillReader.list(lookup);
    const gated = gateCatalog(candidates, facts, settings, projectSkills);
    return { ...gated, facts, key: factsKey(facts) };
  }

  /** The provider one agent sees. */
  class UnitySkillProvider implements SkillProvider {
    readonly name: string;
    private readonly resolveView: (
      options: SkillLookupOptions,
    ) => Promise<GatedCatalog & { facts: ProjectFacts | undefined; key: string }>;

    constructor(providerName: string, resolveView: UnitySkillProvider['resolveView']) {
      this.name = providerName;
      this.resolveView = resolveView;
    }

    async list(lookup: SkillLookupOptions = {}): Promise<readonly SkillCandidate[]> {
      const result = await this.resolveView(lookup);
      return result.candidates;
    }

    get(candidate: SkillCandidate, lookup: SkillLookupOptions = {}) {
      return skillReader.load(candidate, lookup);
    }
  }

  function cwdOf(agent: AgentLike | undefined): string | undefined {
    const session = agent?.session;
    let directory: string | undefined;
    try {
      directory = serviceOf<WorkingDirectoryService>(ctx, 'workingDirectory')?.get(session);
    } catch {
      directory = undefined;
    }
    return directory ?? session?.header?.cwd ?? session?.cwd;
  }

  /** Refresh the last observed facts for one registration; only a real move invalidates. */
  async function refresh(agent: AgentLike, state: Registration): Promise<void> {
    const cwd = cwdOf(agent) ?? state.cwd;
    if (cwd === undefined) return;
    const now = Date.now();
    if (cwd === state.cwd && state.facts !== undefined) {
      const fingerprint = await projectFingerprint(state.facts.root);
      if (fingerprint === state.fingerprint) return;
    } else if (cwd === state.cwd && now - state.lastCheckAt < PROJECT_APPEARED_RECHECK_MS) {
      return;
    }

    const result = await view(cwd, {}, true);
    const previousKey = state.lastKey;
    state.cwd = cwd;
    state.facts = result.facts;
    state.hidden = result.hidden;
    state.lastKey = result.key;
    state.fingerprint = result.facts === undefined ? 'none' : await projectFingerprint(result.facts.root);
    state.lastCheckAt = now;
    if (previousKey !== result.key) state.control?.invalidate();
  }

  async function add(agent: AgentLike | undefined): Promise<RegistrationResult> {
    const id = agent?.session?.id ?? agent?.id;
    if (id === undefined || states.has(id)) return 'skipped';
    const agentSkills = serviceOf<SkillsService>(agent?.ctx, 'skills');
    if (agentSkills === undefined) return 'unavailable';

    const cwd = cwdOf(agent);
    const state: Registration = {
      id,
      agent: agent as AgentLike,
      cwd,
      control: undefined,
      facts: undefined,
      hidden: [],
      lastKey: 'unset',
      fingerprint: 'none',
      lastCheckAt: 0,
      disposers: [],
    };
    states.set(id, state);

    const provider = new UnitySkillProvider(settings.providerName, async (lookup) => {
      const current = cwdOf(agent) ?? cwd;
      const result = await view(current, lookup);
      const previousKey = state.lastKey;
      state.cwd = current;
      state.facts = result.facts;
      state.hidden = result.hidden;
      state.lastKey = result.key;
      state.fingerprint = result.facts === undefined ? 'none' : await projectFingerprint(result.facts.root);
      state.lastCheckAt = Date.now();
      if (previousKey !== 'unset' && previousKey !== result.key) {
        // Facts moved while the catalog cache was warm: refresh it so the next
        // snapshot reflects the new gating instead of the cached candidates.
        const control = state.control;
        if (control !== undefined) queueMicrotask(() => control.invalidate());
      }
      return result;
    });

    const registrations: Array<() => void> = [];
    registrations.push(
      agentSkills.registerProvider((control) => {
        state.control = control;
        return provider;
      }),
    );

    const agentPrompt = serviceOf<SystemPromptService>(agent?.ctx, 'systemPrompt');
    if (settings.injectContext && agentPrompt !== undefined) {
      registrations.push(
        agentPrompt.context({
          name: 'unity:project',
          order: CONTEXT_ORDER,
          text: () => renderContext(state.facts, state.hidden) ?? '',
        }),
      );
    }

    const agentCtx = agent?.ctx;
    if (agentCtx?.on !== undefined) {
      const onPreStep = async (...args: unknown[]): Promise<unknown> => {
        const next = args[1] as (() => Promise<unknown>) | undefined;
        try {
          await refresh(agent as AgentLike, state);
        } catch (error) {
          if (!isAbort(error)) ctx.logger.warn(`unity skills: project refresh failed: ${String(error)}`);
        }
        return next === undefined ? undefined : next();
      };
      registrations.push(agentCtx.on('agent/pre-step', onPreStep));
    }

    if (agentCtx?.effect !== undefined) {
      state.disposers.push(
        agentCtx.effect(
          () => () => {
            for (const dispose of registrations.splice(0).reverse()) {
              try {
                dispose();
              } catch (error) {
                ctx.logger.warn(`unity skills: registration cleanup failed: ${String(error)}`);
              }
            }
          },
          'unity-skills agent',
        ),
      );
    } else {
      state.disposers.push(...registrations);
    }

    // Prime the facts and the hidden list so the first prompt assembly already
    // carries the context, not only the second one after a catalog read. A
    // failure here (an unreadable skill directory, cancellation during agent
    // creation) must not prevent the provider from being registered: the next
    // lookup retries discovery and the context stays empty until it succeeds.
    try {
      const primed = await view(cwd, { signal: state.control?.signal }, true);
      state.cwd = cwd;
      state.facts = primed.facts;
      state.hidden = primed.hidden;
      state.lastKey = primed.key;
      state.fingerprint = primed.facts === undefined ? 'none' : await projectFingerprint(primed.facts.root);
      state.lastCheckAt = Date.now();
    } catch (error) {
      if (!isAbort(error)) ctx.logger.warn(`unity skills: initial catalog read failed: ${String(error)}`);
    }
    return 'registered';
  }

  function remove(agent: AgentLike | undefined): void {
    const id =
      typeof agent?.session?.id === 'string' ? agent.session.id : typeof agent?.id === 'string' ? agent.id : undefined;
    if (id === undefined) return;
    const state = states.get(id);
    if (state === undefined) return;
    states.delete(id);
    for (const dispose of state.disposers.splice(0)) {
      try {
        dispose();
      } catch (error) {
        ctx.logger.warn(`unity skills: registration cleanup failed: ${String(error)}`);
      }
    }
  }

  return {
    reader: skillReader,
    size: () => states.size,
    add,
    remove,
    factsFor,
    projectSkillsFor: overridesFor,
    invalidateAll() {
      for (const state of states.values()) state.control?.invalidate();
    },
    disposeAll() {
      // Snapshot: `remove()` disposes registrations that can re-enter this map,
      // so the loop must not observe entries added while it runs.
      const snapshot = [...states.values()];
      for (const state of snapshot) remove(state.agent);
      states.clear();
      factsByCwd.clear();
      overridesByRoot.clear();
    },
  };
}

/**
 * Resolve an optional service from a context without requiring an injection.
 *
 * @param context - the context to read from, possibly an agent scope.
 * @param name - service name.
 * @returns the service, or `undefined` when unavailable.
 */
export function serviceOf<T>(context: { get(name: string): unknown } | undefined, name: string): T | undefined {
  if (context === undefined) return undefined;
  try {
    return context.get(name) as T | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Options passed to the real project detector.
 *
 * The CLI lookup is cached for a minute: whether `unity` is on `PATH` does not
 * change between two steps, and probing it on every fact check would spend a
 * subprocess resolution per step. File facts keep their short TTL.
 *
 * @param ctx - plugin context used to reach the optional subprocess service.
 * @param signal - cancellation for the detection that consumes the options.
 * @returns detector options.
 */
export function resolveDetectOptions(ctx: PluginContext, signal?: AbortSignal): DetectOptions {
  const subprocess = serviceOf<SubprocessService>(ctx, 'subprocess');
  let cli: { value: string | undefined; at: number } | undefined;
  return {
    maxDepth: 8,
    ...(signal === undefined ? {} : { signal }),
    ...(subprocess === undefined
      ? {}
      : {
          resolveExecutable: async (command: string) => {
            const now = Date.now();
            if (cli !== undefined && now - cli.at < CLI_TTL_MS) return cli.value;
            try {
              const value = await subprocess.resolveExecutable(command, undefined, signal);
              cli = { value, at: now };
              return value;
            } catch {
              cli = { value: undefined, at: now };
              return undefined;
            }
          },
        }),
  };
}

/**
 * Build a single provider that resolves project facts from each lookup's `cwd`.
 *
 * Used as the fallback when a plugin context cannot reach `agent.ctx.skills`: the
 * catalog still follows each lookup's working directory, but it registers in the
 * global layer, where the nearest layer (the agent preset) wins a duplicate name.
 * Context contribution stays agent-scoped, so a deployment on this path gets
 * gating without the runtime-context line.
 *
 * @param options - settings and the registry whose caches are reused.
 * @returns the provider to register globally.
 */
export function createGlobalProvider(options: { settings: RegistrySettings; registry: AgentRegistry }): SkillProvider {
  const { settings, registry } = options;
  return {
    name: settings.providerName,
    async list(lookup: SkillLookupOptions = {}) {
      const candidates = await registry.reader.list(lookup);
      const facts = await registry.factsFor(lookup.cwd, lookup.signal);
      const projectSkills = await registry.projectSkillsFor(facts);
      return gateCatalog(candidates, facts, settings, projectSkills).candidates;
    },
    get(candidate: SkillCandidate, lookup: SkillLookupOptions = {}) {
      return registry.reader.load(candidate, lookup);
    },
  };
}

/** Re-exported for callers that only need the session shape. */
export type { SessionLike };
