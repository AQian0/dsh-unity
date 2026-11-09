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
 * This module keeps that bookkeeping: one shared reader and parse cache, one
 * fact cache per working directory, and one registration per live agent. It also
 * implements the provider itself, which re-reads the project facts whenever the
 * harness asks for the catalog, so a changed editor version or package list
 * invalidates the catalog instead of waiting for a restart.
 *
 * @module dsh-unity/lib/registry
 */

import { detectProject, factsKey, readProjectSkillNames } from './project.js';
import { gateCatalog, renderContext } from './gating.js';
import { createUnitySkillReader } from './skills.js';

/** How long detected project facts stay fresh before they are read again. */
export const FACTS_TTL_MS = 2000;

/** Prompt order for the contributed Unity context: after policies, before harness source. */
const CONTEXT_ORDER = 180;

/**
 * Create the registry that owns every per-agent registration.
 *
 * @param {object} options - registry settings.
 * @param {object} options.ctx - the plugin's Cordis context (logger and optional services).
 * @param {object} options.settings - resolved plugin settings.
 * @param {ReturnType<typeof createUnitySkillReader>} [options.reader] - shared reader.
 * @param {(cwd: string) => Promise<object | undefined>} [options.detect] - project detector.
 * @param {(root: string) => Promise<Set<string>>} [options.readProjectSkills] - project override reader.
 * @returns {{
 *   reader: object,
 *   size: () => number,
 *   add: (agent: object) => Promise<'registered' | 'unavailable' | 'skipped'>,
 *   remove: (agent: object) => void,
 *   invalidateAll: () => void,
 *   disposeAll: () => void,
 *   factsFor: (cwd: string) => Promise<object | undefined>,
 * }} the registry.
 */
export function createAgentRegistry({ ctx, settings, reader, detect, readProjectSkills }) {
  const skillReader =
    reader ??
    createUnitySkillReader({
      skillDir: settings.skillDir,
      providerName: settings.providerName,
      source: 'unity',
      rank: settings.rank,
      exclude: settings.exclude,
      parseCache: settings.parseCache,
      logger: ctx.logger,
    });

  const detectProjectFacts = detect ?? ((cwd) => detectProject(cwd, resolveDetectOptions(ctx)));
  const readOverrides = readProjectSkills ?? ((root) => readProjectSkillNames(root));

  /** cwd -> { facts, key, at } */
  const factsByCwd = new Map();
  /** project root -> { names, at } */
  const overridesByRoot = new Map();
  /** agent id -> registration state */
  const states = new Map();

  async function factsFor(cwd) {
    if (typeof cwd !== 'string' || cwd === '') return undefined;
    const cached = factsByCwd.get(cwd);
    const now = Date.now();
    if (cached !== undefined && now - cached.at < FACTS_TTL_MS) return cached.facts;
    let facts;
    try {
      facts = await detectProjectFacts(cwd);
    } catch (error) {
      ctx.logger.warn(`unity skills: project detection failed for ${cwd}: ${String(error)}`);
      facts = undefined;
    }
    factsByCwd.set(cwd, { facts, key: factsKey(facts), at: now });
    return facts;
  }

  async function overridesFor(facts) {
    if (facts === undefined || !settings.respectProjectRoots) return new Set();
    const now = Date.now();
    const cached = overridesByRoot.get(facts.root);
    if (cached !== undefined && now - cached.at < FACTS_TTL_MS) return cached.names;
    let names;
    try {
      names = await readOverrides(facts.root);
    } catch {
      names = new Set();
    }
    overridesByRoot.set(facts.root, { names, at: now });
    return names;
  }

  /** Compute the gated catalog for one working directory. */
  async function view(cwd, options) {
    const facts = await factsFor(cwd);
    const projectSkills = await overridesFor(facts);
    const candidates = await skillReader.list(options);
    const gated = gateCatalog(candidates, facts, settings, projectSkills);
    return { facts, factsKey: factsKey(facts), gated };
  }

  class UnitySkillProvider {
    constructor(providerName, resolveView) {
      this.name = providerName;
      this.resolveView = resolveView;
    }

    async list(options = {}) {
      const { candidates } = await this.resolveView(options);
      return candidates;
    }

    get(candidate, options = {}) {
      return skillReader.load(candidate, options);
    }
  }

  function cwdOf(agent) {
    const session = agent?.session;
    let directory;
    try {
      directory = ctx.get('workingDirectory')?.get(session);
    } catch {
      directory = undefined;
    }
    return directory ?? session?.header?.cwd ?? session?.cwd;
  }

  /** Resolve an optional service from a context without requiring an injection. */
  function serviceOf(context, name) {
    if (context === undefined || context === null) return undefined;
    if (typeof context.get === 'function') {
      try {
        return context.get(name);
      } catch {
        return undefined;
      }
    }
    return context[name];
  }

  async function add(agent) {
    const id = agent?.session?.id ?? agent?.id;
    if (id === undefined || states.has(id)) return 'skipped';
    const agentContext = agent?.ctx;
    const agentSkills = serviceOf(agentContext, 'skills');
    if (agentSkills === undefined) return 'unavailable';

    const cwd = cwdOf(agent);
    const state = {
      id,
      agent,
      control: undefined,
      facts: undefined,
      hidden: [],
      lastKey: 'unset',
      disposers: [],
    };
    states.set(id, state);

    const provider = new UnitySkillProvider(settings.providerName, async (options) => {
      const current = cwdOf(agent) ?? cwd;
      const { facts, factsKey: key, gated } = await view(current, options);
      state.facts = facts;
      state.hidden = gated.hidden;
      if (key !== state.lastKey) {
        state.lastKey = key;
        // Facts moved (editor version, packages, project root): refresh the cached
        // catalog so the next snapshot reflects the new gating.
        if (state.control !== undefined) queueMicrotask(() => state.control.invalidate());
      }
      return gated;
    });

    state.disposers.push(agentSkills.registerProvider((control) => {
      state.control = control;
      return provider;
    }));

    const agentPrompt = serviceOf(agentContext, 'systemPrompt');
    if (settings.injectContext && agentPrompt !== undefined) {
      state.disposers.push(
        agentPrompt.context({
          name: 'unity:project',
          order: CONTEXT_ORDER,
          text: () => renderContext(state.facts, state.hidden) ?? '',
        }),
      );
    }
    // Prime the facts so the first prompt assembly already carries the context,
    // without blocking agent creation on a second discovery pass.
    await factsFor(cwd);
    return 'registered';
  }

  function remove(agent) {
    const id = agent?.session?.id ?? agent?.id;
    const state = typeof id === 'string' ? states.get(id) : undefined;
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
      for (const state of [...states.values()]) remove(state.agent);
      states.clear();
      factsByCwd.clear();
      overridesByRoot.clear();
    },
  };
}

/** Options passed to the real project detector. */
function resolveDetectOptions(ctx) {
  const subprocess = ctx.get('subprocess');
  return {
    resolveExecutable:
      subprocess === undefined
        ? undefined
        : async (command) => {
            try {
              return await subprocess.resolveExecutable(command);
            } catch {
              return undefined;
            }
          },
  };
}

/**
 * Build a single provider that resolves project facts from each lookup's `cwd`.
 *
 * Used as the fallback when a plugin context cannot reach `agent.ctx.skills`:
 * the catalog still follows each lookup's working directory, but it registers in
 * the global layer, where the nearest layer (the agent preset) wins a duplicate
 * name and rank decides the rest. Context contribution stays agent-scoped, so a
 * deployment on this path gets gating without the runtime-context line.
 *
 * @param {object} options - provider options.
 * @param {object} options.settings - resolved settings.
 * @param {object} options.registry - agent registry (reuses its caches).
 * @returns {object} the provider to register globally.
 */
export function createGlobalProvider({ settings, registry }) {
  const skillReader = registry.reader;
  return {
    name: settings.providerName,
    async list(options = {}) {
      const candidates = await skillReader.list(options);
      const facts = await registry.factsFor(options.cwd);
      const projectSkills = await registry.projectSkillsFor(facts);
      return gateCatalog(candidates, facts, settings, projectSkills).candidates;
    },
    get(candidate, options = {}) {
      return skillReader.load(candidate, options);
    },
  };
}
