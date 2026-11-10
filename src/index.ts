/**
 * Unity's curated skills as a DeepSeek Harness plugin.
 *
 * The package carries 34 skills under `skills/` and serves them through the
 * harness skill registry. What distinguishes this from a directory of Markdown
 * files is *where* and *how* they are served:
 *
 * - registration happens per agent, through that agent's own context, so this
 *   provider lives in the agent's scope layer and its catalog can depend on the
 *   project the agent is working in;
 * - a Unity project is detected from the session's working directory, and skills
 *   whose `required_editor_version` / `required_packages` cannot be met leave the
 *   model's catalog while staying reachable by explicit name;
 * - the detected project facts are contributed to the agent's runtime context, so
 *   the model states the editor version and package situation instead of guessing;
 * - the skill directory is watched, and a frontmatter membership change
 *   invalidates the cached catalog instead of requiring a restart.
 *
 * @module @aqian0/dsh-unity
 */

import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_PROVIDER_NAME, DEFAULT_RANK, DEFAULT_WORKSPACE_SKILLS } from './config.ts';
import { createAgentRegistry, createGlobalProvider, serviceOf } from './registry.ts';
import type { RegistrySettings } from './registry.ts';
import { createParseCache } from './skills.ts';
import type { ParseCache } from './skills.ts';
import { startSkillsWatcher } from './watch.ts';
import type { AgentLike, AgentsService, FsTarget, PluginContext } from './harness.ts';

/** Loader row name. */
export const name = 'unity-skills';

/** The skill registry this provider attaches to. */
export const inject = ['skills'];

export { Config, DEFAULT_PROVIDER_NAME, DEFAULT_RANK, DEFAULT_WORKSPACE_SKILLS } from './config.ts';

/** Provider name reserved by the registry for per-agent runtime registrations. */
const RESERVED_PROVIDER = 'runtime';

/** Directory of this package, used to locate the packaged skills. */
const PACKAGE_DIR = fileURLToPath(new URL('../', import.meta.url));

/** Row config accepted from the loader patch. */
export interface PluginConfig {
  readonly providerName?: string;
  readonly rank?: number;
  readonly skillDir?: string;
  readonly exclude?: readonly string[];
  readonly workspaceSkills?: readonly string[];
  readonly gateByProject?: boolean;
  readonly enforceRequirements?: boolean;
  readonly injectContext?: boolean;
  readonly watchSkills?: boolean;
  readonly respectProjectRoots?: boolean;
  readonly statusCommand?: boolean;
}

/** Normalized settings, with the parse cache attached by {@link apply}. */
export interface ResolvedSettings extends RegistrySettings {
  readonly watchSkills: boolean;
  readonly statusCommand: boolean;
  parseCache: ParseCache | undefined;
}

/**
 * Register the Unity skill provider on `ctx.skills`.
 *
 * @param ctx - Cordis plugin context; `skills` is injected.
 * @param config - row config from the loader patch.
 */
export function apply(ctx: PluginContext, config: PluginConfig = {}): void {
  const settings = resolveSettings(config);
  settings.parseCache = createParseCache();
  const registry = createAgentRegistry({ ctx, settings });

  const disposers: Array<() => void> = [];
  let fallbackRegistered = false;
  let refreshQueued = false;

  /**
   * Invalidate every catalog once per microtask batch.
   *
   * Both the watcher and `fs/observed` can report the same edit; coalescing keeps
   * one file save from appending one replacement catalog per event.
   */
  const refreshCatalog = (): void => {
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => {
      refreshQueued = false;
      settings.parseCache?.clear();
      registry.invalidateAll();
    });
  };

  /**
   * Observe the harness's authoritative file observation.
   *
   * `fs/observed` is emitted synchronously by the first-party write/edit tools,
   * so a model-authored `SKILL.md` change invalidates the catalog without
   * waiting for the host watcher. The listener must stay synchronous and must
   * not throw.
   */
  const onFsObserved = (...args: unknown[]): void => {
    try {
      const target = args[0] as FsTarget | undefined;
      const displayPath = target?.displayPath;
      if (typeof displayPath !== 'string' || displayPath === '') return;
      const resolved = resolve(displayPath);
      if (basename(resolved) !== 'SKILL.md') return;
      const relativePath = relative(settings.skillDir, resolved);
      if (relativePath === '' || relativePath.startsWith('..') || isAbsolute(relativePath)) return;
      refreshCatalog();
    } catch {
      // An observation listener that throws fails the tool call; stay inert.
    }
  };

  /** Serve one global provider when this context cannot register per agent. */
  const ensureFallback = (): void => {
    if (fallbackRegistered) return;
    fallbackRegistered = true;
    ctx.skills.registerProvider(() => createGlobalProvider({ settings, registry }));
    ctx.logger.warn(
      'unity skills: per-agent registration is unavailable in this profile, so one global provider serves every session. Project gating still follows the session directory, but agent-preset skills win duplicate names.',
    );
  };

  const onCreated = async (payload: unknown): Promise<void> => {
    const agent = (payload as { agent?: AgentLike } | undefined)?.agent;
    try {
      const result = await registry.add(agent);
      if (result === 'unavailable') ensureFallback();
    } catch (error) {
      ctx.logger.warn(`unity skills: agent registration failed: ${String(error)}`);
    }
  };

  const agents = serviceOf<AgentsService>(ctx, 'agents');
  if (agents === undefined) {
    ensureFallback();
  } else {
    disposers.push(
      ctx.on('agent/created', (payload) => onCreated(payload)),
      ctx.on('agent/disposed', (payload) => registry.remove((payload as { agent?: AgentLike } | undefined)?.agent)),
    );
    for (const agent of agents.list()) void onCreated({ agent });
  }

  disposers.push(ctx.on('fs/observed', onFsObserved));

  if (settings.watchSkills) {
    disposers.push(
      startSkillsWatcher({
        dir: settings.skillDir,
        logger: ctx.logger,
        onChange: refreshCatalog,
      }),
    );
  }

  ctx.effect(
    () => () => {
      for (const dispose of disposers.splice(0)) {
        try {
          dispose();
        } catch {
          // Disposal is best-effort; the fiber is going away either way.
        }
      }
      registry.disposeAll();
    },
    'unity-skills lifecycle',
  );
}

/**
 * Validate row config into normalized settings.
 *
 * @param config - row config from the loader patch.
 * @returns normalized settings.
 * @throws {TypeError} when a field is present but unusable.
 */
export function resolveSettings(config: PluginConfig): ResolvedSettings {
  const providerName = config.providerName ?? DEFAULT_PROVIDER_NAME;
  if (typeof providerName !== 'string' || providerName.trim() === '') {
    throw new TypeError('unity-skills: providerName must be a non-empty string');
  }
  if (providerName === RESERVED_PROVIDER) {
    throw new TypeError(
      `unity-skills: providerName "${RESERVED_PROVIDER}" is reserved for runtime skill registrations`,
    );
  }
  const rank = config.rank ?? DEFAULT_RANK;
  if (typeof rank !== 'number' || !Number.isFinite(rank)) {
    throw new TypeError('unity-skills: rank must be a finite number');
  }
  const skillDirConfig = config.skillDir ?? join(PACKAGE_DIR, 'skills');
  if (typeof skillDirConfig !== 'string' || skillDirConfig.trim() === '') {
    throw new TypeError('unity-skills: skillDir must be a non-empty string');
  }
  const exclude = readStringArray(config.exclude, 'exclude');
  const workspaceSkills = readStringArray(config.workspaceSkills, 'workspaceSkills') ?? DEFAULT_WORKSPACE_SKILLS;
  return {
    providerName,
    rank,
    source: 'unity',
    skillDir: resolve(PACKAGE_DIR, skillDirConfig),
    exclude: new Set(exclude ?? []),
    workspaceSkills: new Set(workspaceSkills),
    gateByProject: readBoolean(config.gateByProject, 'gateByProject', true),
    enforceRequirements: readBoolean(config.enforceRequirements, 'enforceRequirements', true),
    injectContext: readBoolean(config.injectContext, 'injectContext', true),
    watchSkills: readBoolean(config.watchSkills, 'watchSkills', true),
    respectProjectRoots: readBoolean(config.respectProjectRoots, 'respectProjectRoots', true),
    statusCommand: readBoolean(config.statusCommand, 'statusCommand', true),
    parseCache: undefined,
  };
}

/** Read an optional string-array field. */
function readStringArray(value: readonly string[] | undefined, field: string): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim() === '')) {
    throw new TypeError(`unity-skills: ${field} must be an array of non-empty strings`);
  }
  return value;
}

/** Read an optional boolean field. */
function readBoolean(value: boolean | undefined, field: string, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new TypeError(`unity-skills: ${field} must be a boolean`);
  return value;
}
