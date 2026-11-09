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
 * - the skill directory is watched, and a frontmatter or membership change
 *   invalidates the cached catalog instead of requiring a restart.
 *
 * @module @aqian0/dsh-unity
 */

import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAgentRegistry, createGlobalProvider } from './lib/registry.js';
import { createParseCache } from './lib/skills.js';
import { startSkillsWatcher } from './lib/watch.js';

/** Loader row name. */
export const name = 'unity-skills';

/** The skill registry this provider attaches to. */
export const inject = ['skills'];

/** Provider name the registry lists the catalog under. */
export const DEFAULT_PROVIDER_NAME = 'unity';

/**
 * Default rank inside one scope layer. The catalog normally lands in the agent's
 * own layer, where the nearest layer already wins duplicates; the rank only
 * orders this provider against runtime (`ctx.skills.register()`) registrations,
 * which use 250.
 */
export const DEFAULT_RANK = 240;

/**
 * Skills worth showing outside a Unity project: creating a project, driving the
 * editor from the CLI, and managing packages are all meaningful before a project
 * exists.
 */
export const DEFAULT_WORKSPACE_SKILLS = ['new-unity-project', 'unity-cli', 'unity-package-management'];

/** Provider name reserved by the registry for per-agent runtime registrations. */
const RESERVED_PROVIDER = 'runtime';

/** Directory of this package, used to locate the packaged skills. */
const PACKAGE_DIR = fileURLToPath(new URL('.', import.meta.url));

/**
 * Register the Unity skill provider on `ctx.skills`.
 *
 * @param {object} ctx - Cordis plugin context; `skills` is injected.
 * @param {object} [config] - row config from the loader patch.
 */
export function apply(ctx, config = {}) {
  const settings = resolveSettings(config);
  settings.parseCache = createParseCache();
  const registry = createAgentRegistry({ ctx, settings });

  const disposers = [];
  let fallbackRegistered = false;

  /** Serve one global provider when this context cannot register per agent. */
  const ensureFallback = () => {
    if (fallbackRegistered) return;
    fallbackRegistered = true;
    ctx.skills.registerProvider(() => createGlobalProvider({ settings, registry }));
    ctx.logger.warn(
      'unity skills: per-agent registration is unavailable in this profile, so one global provider serves every session. Project gating still follows the session directory, but agent-preset skills win duplicate names.',
    );
  };

  const onCreated = async (payload) => {
    try {
      const result = await registry.add(payload?.agent);
      if (result === 'unavailable') ensureFallback();
    } catch (error) {
      ctx.logger.warn(`unity skills: agent registration failed: ${String(error)}`);
    }
  };

  const agents = ctx.get('agents');
  if (agents === undefined) {
    ensureFallback();
  } else {
    disposers.push(ctx.on('agent/created', onCreated));
    disposers.push(ctx.on('agent/disposed', (payload) => registry.remove(payload?.agent)));
    for (const agent of agents.list()) {
      void onCreated({ agent });
    }
  }

  if (settings.watchSkills) {
    disposers.push(
      startSkillsWatcher({
        dir: settings.skillDir,
        logger: ctx.logger,
        onChange: () => {
          settings.parseCache.clear();
          registry.invalidateAll();
        },
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
 * @param {object} config - row config from the loader patch.
 * @returns {object} normalized settings.
 * @throws {TypeError} when a field is present but unusable.
 */
export function resolveSettings(config) {
  const providerName = config.providerName ?? DEFAULT_PROVIDER_NAME;
  if (typeof providerName !== 'string' || providerName.trim() === '') {
    throw new TypeError('unity-skills: providerName must be a non-empty string');
  }
  if (providerName === RESERVED_PROVIDER) {
    throw new TypeError(`unity-skills: providerName "${RESERVED_PROVIDER}" is reserved for runtime skill registrations`);
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
    skillDir: resolve(skillDirConfig),
    exclude: new Set(exclude ?? []),
    workspaceSkills: new Set(workspaceSkills),
    gateByProject: readBoolean(config.gateByProject, 'gateByProject', true),
    enforceRequirements: readBoolean(config.enforceRequirements, 'enforceRequirements', true),
    injectContext: readBoolean(config.injectContext, 'injectContext', true),
    watchSkills: readBoolean(config.watchSkills, 'watchSkills', true),
    respectProjectRoots: readBoolean(config.respectProjectRoots, 'respectProjectRoots', true),
    parseCache: undefined,
  };
}

/** Read an optional string-array field. */
function readStringArray(value, field) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim() === '')) {
    throw new TypeError(`unity-skills: ${field} must be an array of non-empty strings`);
  }
  return value;
}

/** Read an optional boolean field. */
function readBoolean(value, field, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new TypeError(`unity-skills: ${field} must be a boolean`);
  return value;
}
