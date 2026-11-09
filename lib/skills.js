/**
 * Discovery and loading for the packaged Unity skills.
 *
 * Each skill is a directory bundle `<skillDir>/<name>/SKILL.md`, the same shape
 * the harness filesystem provider reads, so the tree needs no transformation.
 * Discovery parses frontmatter into a catalog candidate and every load re-reads
 * the file, matching the harness convention that a skill body has no separate
 * cache.
 *
 * @module dsh-unity/lib/skills
 */

import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { SKILL_NAME, parseInvocation, parseSkillMarkdown } from './frontmatter.js';

/**
 * Create a reader for one vendored skill directory.
 *
 * @param {object} options - reader settings.
 * @param {string} options.skillDir - absolute path of the directory holding skill bundles.
 * @param {string} options.providerName - provider name reported on every candidate.
 * @param {string} options.source - source label reported on every candidate.
 * @param {number} options.rank - precedence rank used by the registry when two providers
 *   offer the same skill name.
 * @param {Set<string>} [options.exclude] - skill names to leave out of the catalog.
 * @param {{ warn: (message: string) => void }} options.logger - sink for skipped-skill warnings.
 * @returns {{
 *   skillDir: string,
 *   list: (options?: { signal?: AbortSignal }) => Promise<object[]>,
 *   load: (candidate: object, options?: { signal?: AbortSignal }) => Promise<object | undefined>,
 * }} the reader.
 */
export function createUnitySkillReader({ skillDir, providerName, source, rank, exclude, logger }) {
  /** Parse one skill bundle into a catalog candidate. */
  async function parseBundle(entryName, dir) {
    const file = join(dir, 'SKILL.md');
    const raw = await readFile(file, 'utf8');
    const parsed = parseSkillMarkdown(raw);
    if (parsed === undefined) {
      logger.warn(`unity skills: ${file} skipped because it has no YAML frontmatter`);
      return undefined;
    }
    const { data, body } = parsed;
    const skillName = typeof data.name === 'string' ? data.name.trim() : '';
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    if (!SKILL_NAME.test(skillName) || description.length === 0) {
      logger.warn(`unity skills: ${file} skipped because frontmatter requires a kebab-case name and a description`);
      return undefined;
    }
    if (skillName !== entryName) {
      logger.warn(`unity skills: ${file} declares name "${skillName}" but its folder is "${entryName}"`);
    }
    const invocation = parseInvocation(data);
    const whenToUse = typeof data.whenToUse === 'string' && data.whenToUse.trim() !== '' ? data.whenToUse.trim() : undefined;
    const metadata = isPlainMapping(data.metadata) ? data.metadata : undefined;
    return {
      candidate: {
        name: skillName,
        description,
        ...(whenToUse === undefined ? {} : { whenToUse }),
        invocation,
        provider: providerName,
        source,
        rank,
        locator: { dir, file },
        resourceBase: { kind: 'directory', path: dir },
        path: file,
        ...(metadata === undefined ? {} : { metadata }),
      },
      body,
    };
  }

  return {
    skillDir,

    /** Discover every vendored skill bundle for the catalog. */
    async list(options = {}) {
      options.signal?.throwIfAborted();
      let entries;
      try {
        entries = await readdir(skillDir, { withFileTypes: true });
      } catch (error) {
        if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return [];
        throw error;
      }
      const candidates = [];
      for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
        options.signal?.throwIfAborted();
        if (exclude !== undefined && exclude.has(entry.name)) continue;
        const dir = join(skillDir, entry.name);
        if (!(await isDirectory(dir, entry))) continue;
        try {
          const parsed = await parseBundle(entry.name, dir);
          if (parsed !== undefined) candidates.push(parsed.candidate);
        } catch (error) {
          options.signal?.throwIfAborted();
          logger.warn(`unity skills: ${dir} skipped: ${String(error)}`);
        }
      }
      return candidates;
    },

    /** Load one skill body, re-reading the file so edits are visible immediately. */
    async load(candidate, options = {}) {
      options.signal?.throwIfAborted();
      const locator = candidate?.locator;
      if (typeof locator?.dir !== 'string' || typeof locator.file !== 'string') return undefined;
      let raw;
      try {
        raw = await readFile(locator.file, 'utf8');
      } catch (error) {
        if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return undefined;
        throw error;
      }
      options.signal?.throwIfAborted();
      const parsed = parseSkillMarkdown(raw);
      if (parsed === undefined) return undefined;
      const { data, body } = parsed;
      const skillName = typeof data.name === 'string' ? data.name.trim() : '';
      const description = typeof data.description === 'string' ? data.description.trim() : '';
      if (!SKILL_NAME.test(skillName) || description.length === 0) return undefined;
      const whenToUse = typeof data.whenToUse === 'string' && data.whenToUse.trim() !== '' ? data.whenToUse.trim() : undefined;
      const metadata = isPlainMapping(data.metadata) ? data.metadata : undefined;
      const resolved = await resolveDisplayPath(locator.file);
      return {
        name: skillName,
        description,
        ...(whenToUse === undefined ? {} : { whenToUse }),
        invocation: parseInvocation(data),
        source,
        provider: providerName,
        resourceBase: { kind: 'directory', path: locator.dir },
        path: resolved,
        ...(metadata === undefined ? {} : { metadata }),
        content: body,
      };
    },
  };
}

/** Whether a directory entry is a directory, following symlinks. */
async function isDirectory(dir, entry) {
  if (entry.isDirectory()) return true;
  if (!entry.isSymbolicLink()) return false;
  try {
    return (await stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

/** Prefer the real path for previews, falling back to the discovered path. */
async function resolveDisplayPath(file) {
  try {
    return await realpath(file);
  } catch {
    return file;
  }
}

/** Whether a parsed value is a plain mapping usable as skill metadata. */
function isPlainMapping(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
