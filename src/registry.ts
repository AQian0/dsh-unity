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
 * cache per working directory, and one registration per live agent. It also
 * implements the provider itself, which re-reads the project facts whenever the
 * harness asks for the catalog, so a changed editor version or package list
 * invalidates the catalog instead of waiting for a restart.
 *
 * @module dsh-unity/lib/registry
 */

import { detectProject, factsKey, readProjectSkillNames } from './project.ts';
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
  control: SkillProviderControl | undefined;
  facts: ProjectFacts | undefined;
  hidden: readonly HiddenSkill[];
  lastKey: string;
  disposers: Array<() => void>;
}

/** Options for {@link createAgentRegistry}. */
export interface RegistryOptions {
  readonly ctx: PluginContext;
  readonly settings: RegistrySettings;
  readonly reader?: UnitySkillReader;
  readonly detect?: (cwd: string) => Promise<ProjectFacts | undefined>;
  readonly readProjectSkills?: (root: string) => Promise<Set<string>>;
}

/** The result of trying to register one agent. */
export type RegistrationResult = 'registered' | 'unavailable' | 'skipped';

/** The registry handed to the plugin entry point. */
export interface AgentRegistry {
  readonly reader: UnitySkillReader;
  size(): number;
  add(agent: AgentLike | undefined): Promise<RegistrationResult>;
  remove(agent: AgentLike | undefined): void;
  factsFor(cwd: string | undefined): Promise<ProjectFacts | undefined>;
  projectSkillsFor(facts: ProjectFacts | undefined): Promise<Set<string>>;
  invalidateAll(): void;
  disposeAll(): void;
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

  const detectProjectFacts = options.detect ?? ((cwd: string) => detectProject(cwd, resolveDetectOptions(ctx)));
  const readOverrides = options.readProjectSkills ?? ((root: string) => readProjectSkillNames(root));

  const factsByCwd = new Map<string, { facts: ProjectFacts | undefined; at: number }>();
  const overridesByRoot = new Map<string, { names: Set<string>; at: number }>();
  const states = new Map<string, Registration>();

  async function factsFor(cwd: string | undefined): Promise<ProjectFacts | undefined> {
    if (typeof cwd !== 'string' || cwd === '') return undefined;
    const cached = factsByCwd.get(cwd);
    const now = Date.now();
    if (cached !== undefined && now - cached.at < FACTS_TTL_MS) return cached.facts;
    let facts: ProjectFacts | undefined;
    try {
      facts = await detectProjectFacts(cwd);
    } catch (error) {
      ctx.logger.warn(`unity skills: project detection failed for ${cwd}: ${String(error)}`);
      facts = undefined;
    }
    factsByCwd.set(cwd, { facts, at: now });
    return facts;
  }

  async function overridesFor(facts: ProjectFacts | undefined): Promise<Set<string>> {
    if (facts === undefined || !settings.respectProjectRoots) return new Set<string>();
    const now = Date.now();
    const cached = overridesByRoot.get(facts.root);
    if (cached !== undefined && now - cached.at < FACTS_TTL_MS) return cached.names;
    let names: Set<string>;
    try {
      names = await readOverrides(facts.root);
    } catch {
      names = new Set<string>();
    }
    overridesByRoot.set(facts.root, { names, at: now });
    return names;
  }

  /** Compute the gated catalog for one working directory. */
  async function view(
    cwd: string | undefined,
    lookup: SkillLookupOptions,
  ): Promise<GatedCatalog & { facts: ProjectFacts | undefined; key: string }> {
    const facts = await factsFor(cwd);
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

  async function add(agent: AgentLike | undefined): Promise<RegistrationResult> {
    const id = agent?.session?.id ?? agent?.id;
    if (id === undefined || states.has(id)) return 'skipped';
    const agentSkills = serviceOf<SkillsService>(agent?.ctx, 'skills');
    if (agentSkills === undefined) return 'unavailable';

    const cwd = cwdOf(agent);
    const state: Registration = {
      id,
      agent: agent as AgentLike,
      control: undefined,
      facts: undefined,
      hidden: [],
      lastKey: 'unset',
      disposers: [],
    };
    states.set(id, state);

    const provider = new UnitySkillProvider(settings.providerName, async (lookup) => {
      const current = cwdOf(agent) ?? cwd;
      const result = await view(current, lookup);
      state.facts = result.facts;
      state.hidden = result.hidden;
      if (result.key !== state.lastKey) {
        state.lastKey = result.key;
        // Facts moved (editor version, packages, project root): refresh the cached
        // catalog so the next snapshot reflects the new gating.
        const control = state.control;
        if (control !== undefined) queueMicrotask(() => control.invalidate());
      }
      return result;
    });

    state.disposers.push(
      agentSkills.registerProvider((control) => {
        state.control = control;
        return provider;
      }),
    );

    const agentPrompt = serviceOf<SystemPromptService>(agent?.ctx, 'systemPrompt');
    if (settings.injectContext && agentPrompt !== undefined) {
      state.disposers.push(
        agentPrompt.context({
          name: 'unity:project',
          order: CONTEXT_ORDER,
          text: () => renderContext(state.facts, state.hidden) ?? '',
        }),
      );
    }
    // Prime the facts so the first prompt assembly already carries the context.
    await factsFor(cwd);
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

/** Options passed to the real project detector. */
export function resolveDetectOptions(ctx: PluginContext): DetectOptions {
  const subprocess = serviceOf<SubprocessService>(ctx, 'subprocess');
  return {
    maxDepth: 8,
    ...(subprocess === undefined
      ? {}
      : {
          resolveExecutable: async (command: string) => {
            try {
              return await subprocess.resolveExecutable(command);
            } catch {
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
      const facts = await registry.factsFor(lookup.cwd);
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
