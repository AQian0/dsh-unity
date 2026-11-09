/**
 * Unity's official agent skills as a DeepSeek Harness plugin.
 *
 * This package carries 34 Unity skills and maintains them: the provider
 * registers whatever is under `skills/` with the harness skill registry, so a
 * session's catalog reflects this repository, and every skill loads on demand.
 *
 * @module @aqian0/dsh-unity
 */

import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createUnitySkillReader } from './lib/skills.js';

/** Loader row name. */
export const name = 'unity-skills';

/** Provider name the registry lists the vendored catalog under. */
export const DEFAULT_PROVIDER_NAME = 'unity';

/** The skill registry this provider attaches to. */
export const inject = ['skills'];

/** Provider name reserved by the registry for per-agent runtime registrations. */
const RESERVED_PROVIDER = 'runtime';

/**
 * Default precedence rank. Lower ranks win when two providers offer the same
 * skill name. This sits between the harness custom root (300) and user roots
 * (400, 500), so the installed plugin supplies the Unity catalog while a
 * project's own `.dsh/skills` or `.agents/skills` still overrides a single
 * skill, and local agent-skill copies cannot shadow a newer plugin version.
 */
export const DEFAULT_RANK = 350;

/** Directory of this package, used to locate the vendored skills. */
const PACKAGE_DIR = fileURLToPath(new URL('.', import.meta.url));

/** Accepted skill bundle layout inside the vendored directory. */
const SKILL_FILE = 'SKILL.md';

/**
 * Register the Unity skill provider on `ctx.skills`.
 *
 * @param {object} ctx - Cordis plugin context; `skills` is injected.
 * @param {object} [config] - row config from the loader patch.
 * @param {string} [config.providerName] - provider name reported to the registry.
 * @param {number} [config.rank] - precedence rank for catalog conflicts.
 * @param {string} [config.skillDir] - directory holding skill bundles.
 * @param {string[]} [config.exclude] - skill names to leave out of the catalog.
 */
export function apply(ctx, config = {}) {
  const settings = resolveSettings(config);
  const reader = createUnitySkillReader({
    skillDir: settings.skillDir,
    providerName: settings.providerName,
    source: 'unity',
    rank: settings.rank,
    exclude: settings.exclude.size === 0 ? undefined : settings.exclude,
    logger: ctx.logger,
  });
  ctx.skills.registerProvider((control) => new UnitySkillProvider(settings.providerName, reader, control));
}

/**
 * The registry-facing half of this plugin: a thin provider over the vendored
 * reader. Ownership of the discovery cache stays with the registry, so the
 * provider is deliberately stateless.
 */
export class UnitySkillProvider {
  /**
   * @param {string} providerName - provider name reported on every candidate.
   * @param {ReturnType<typeof createUnitySkillReader>} reader - skill source.
   * @param {{ signal: AbortSignal }} control - registration lifecycle from the registry.
   */
  constructor(providerName, reader, control) {
    this.name = providerName;
    this.reader = reader;
    this.signal = control?.signal;
  }

  /**
   * List catalog candidates.
   *
   * @param {{ signal?: AbortSignal }} [options] - lookup options.
   * @returns {Promise<object[]>} invocation-neutral candidates.
   */
  list(options = {}) {
    return this.reader.list(withLifecycleSignal(options, this.signal));
  }

  /**
   * Load one skill body for the winning candidate.
   *
   * @param {object} candidate - candidate produced by {@link list}.
   * @param {{ signal?: AbortSignal }} [options] - lookup options.
   * @returns {Promise<object | undefined>} the skill definition, or `undefined` when
   *   the bundle disappeared or no longer parses.
   */
  get(candidate, options = {}) {
    return this.reader.load(candidate, withLifecycleSignal(options, this.signal));
  }
}

/**
 * Combine the registration lifecycle with a lookup signal so a disposed
 * provider stops discovery even when the caller's signal never fires.
 *
 * @param {{ signal?: AbortSignal }} options - lookup options.
 * @param {AbortSignal | undefined} lifecycle - registration lifecycle signal.
 * @returns {{ signal?: AbortSignal }} lookup options carrying the combined signal.
 */
function withLifecycleSignal(options, lifecycle) {
  if (lifecycle === undefined) return options;
  if (options.signal === undefined) return { ...options, signal: lifecycle };
  return { ...options, signal: AbortSignal.any([options.signal, lifecycle]) };
}

/**
 * Validate row config into normalized settings.
 *
 * @param {object} config - row config from the loader patch.
 * @returns {{ providerName: string, rank: number, skillDir: string, exclude: Set<string> }} settings.
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
  const excludeConfig = config.exclude ?? [];
  if (!Array.isArray(excludeConfig) || excludeConfig.some((entry) => typeof entry !== 'string')) {
    throw new TypeError('unity-skills: exclude must be an array of skill names');
  }
  return {
    providerName,
    rank,
    skillDir: resolve(skillDirConfig),
    exclude: new Set(excludeConfig),
  };
}

export { SKILL_FILE };
