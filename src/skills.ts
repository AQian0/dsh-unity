/**
 * Discovery and loading for the packaged Unity skills.
 *
 * Each skill is a directory bundle `<skillDir>/<name>/SKILL.md`, the same shape
 * the harness filesystem provider reads, so the tree needs no transformation.
 * Discovery parses frontmatter into a catalog candidate and every load re-reads
 * the file, matching the harness convention that a skill body has no separate
 * cache.
 *
 * One parse cache is shared by every agent's provider: discovery runs per agent
 * scope, but the files belong to this package, so one cache keyed by path plus
 * modification time and size keeps N agents from re-parsing the same documents
 * while still noticing an edit.
 *
 * @module dsh-unity/lib/skills
 */

import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { SKILL_NAME, parseInvocation, parseSkillMarkdown } from './frontmatter.ts';
import { readRequirements } from './requirements.ts';
import type { SkillCandidate, SkillDefinition, SkillLookupOptions } from './harness.ts';
import type { ParsedSkill } from './frontmatter.ts';

/** Shared frontmatter cache keyed by file path. */
export interface ParseCache {
  read(file: string): Promise<ParsedSkill | undefined>;
  clear(): void;
}

/** Options one reader is created with. */
export interface ReaderOptions {
  readonly skillDir: string;
  readonly providerName: string;
  readonly source: string;
  readonly rank: number;
  readonly exclude?: ReadonlySet<string>;
  readonly parseCache?: ParseCache;
  readonly logger: { warn(message: string): void };
}

/** The reader the provider delegates to. */
export interface UnitySkillReader {
  readonly skillDir: string;
  list(options?: SkillLookupOptions): Promise<SkillCandidate[]>;
  load(candidate: SkillCandidate | undefined, options?: SkillLookupOptions): Promise<SkillDefinition | undefined>;
}

/**
 * Create a frontmatter cache keyed by path and file identity.
 *
 * @returns the cache.
 */
export function createParseCache(): ParseCache {
  const entries = new Map<string, { mtimeMs: number; size: number; parsed: ParsedSkill | undefined }>();
  return {
    async read(file) {
      let info;
      try {
        info = await stat(file);
      } catch {
        return undefined;
      }
      const cached = entries.get(file);
      if (cached !== undefined && cached.mtimeMs === info.mtimeMs && cached.size === info.size) return cached.parsed;
      const parsed = parseSkillMarkdown(await readFile(file, 'utf8'));
      entries.set(file, { mtimeMs: info.mtimeMs, size: info.size, parsed });
      return parsed;
    },
    clear() {
      entries.clear();
    },
  };
}

/**
 * Create a reader for one packaged skill directory.
 *
 * @param options - reader settings.
 * @returns the reader.
 */
export function createUnitySkillReader(options: ReaderOptions): UnitySkillReader {
  const { skillDir, providerName, source, rank, exclude, logger } = options;
  const cache = options.parseCache ?? createParseCache();

  /** Parse one skill bundle into a catalog candidate. */
  async function parseBundle(entryName: string, dir: string): Promise<SkillCandidate | undefined> {
    const file = join(dir, 'SKILL.md');
    const parsed = await cache.read(file);
    if (parsed === undefined) {
      logger.warn(`unity skills: ${file} skipped because it has no YAML frontmatter`);
      return undefined;
    }
    const { data } = parsed;
    const skillName = typeof data.name === 'string' ? data.name.trim() : '';
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    if (!SKILL_NAME.test(skillName) || description.length === 0) {
      logger.warn(`unity skills: ${file} skipped because frontmatter requires a kebab-case name and a description`);
      return undefined;
    }
    if (skillName !== entryName) {
      logger.warn(`unity skills: ${file} declares name "${skillName}" but its folder is "${entryName}"`);
    }
    const whenToUse =
      typeof data.whenToUse === 'string' && data.whenToUse.trim() !== '' ? data.whenToUse.trim() : undefined;
    const metadata =
      typeof data.metadata === 'object' && data.metadata !== null && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : undefined;
    return {
      name: skillName,
      description,
      ...(whenToUse === undefined ? {} : { whenToUse }),
      invocation: parseInvocation(data),
      requirements: readRequirements(data),
      provider: providerName,
      source,
      rank,
      locator: { dir, file },
      resourceBase: { kind: 'directory', path: dir },
      path: file,
      ...(metadata === undefined ? {} : { metadata }),
    };
  }

  return {
    skillDir,
    async list(lookup = {}) {
      lookup.signal?.throwIfAborted();
      let entries;
      try {
        entries = await readdir(skillDir, { withFileTypes: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ENOTDIR')
          return [];
        throw error;
      }
      const candidates: SkillCandidate[] = [];
      for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
        lookup.signal?.throwIfAborted();
        if (exclude !== undefined && exclude.has(entry.name)) continue;
        const dir = join(skillDir, entry.name);
        if (!(await isDirectory(dir, entry.isDirectory(), entry.isSymbolicLink()))) continue;
        try {
          const candidate = await parseBundle(entry.name, dir);
          if (candidate !== undefined) candidates.push(candidate);
        } catch (error) {
          lookup.signal?.throwIfAborted();
          logger.warn(`unity skills: ${dir} skipped: ${String(error)}`);
        }
      }
      return candidates;
    },
    async load(candidate, lookup = {}) {
      lookup.signal?.throwIfAborted();
      const locator = candidate?.locator;
      if (locator === undefined) return undefined;
      let raw: string;
      try {
        raw = await readFile(locator.file, 'utf8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ENOTDIR')
          return undefined;
        throw error;
      }
      lookup.signal?.throwIfAborted();
      const parsed = parseSkillMarkdown(raw);
      if (parsed === undefined) return undefined;
      const { data, body } = parsed;
      const skillName = typeof data.name === 'string' ? data.name.trim() : '';
      const description = typeof data.description === 'string' ? data.description.trim() : '';
      if (!SKILL_NAME.test(skillName) || description.length === 0) return undefined;
      const whenToUse =
        typeof data.whenToUse === 'string' && data.whenToUse.trim() !== '' ? data.whenToUse.trim() : undefined;
      const metadata =
        typeof data.metadata === 'object' && data.metadata !== null && !Array.isArray(data.metadata)
          ? (data.metadata as Record<string, unknown>)
          : undefined;
      return {
        name: skillName,
        description,
        ...(whenToUse === undefined ? {} : { whenToUse }),
        invocation: parseInvocation(data),
        source,
        provider: providerName,
        resourceBase: { kind: 'directory', path: locator.dir },
        path: await resolveDisplayPath(locator.file),
        ...(metadata === undefined ? {} : { metadata }),
        content: body,
      };
    },
  };
}

/** Whether a directory entry is a directory, following symlinks. */
async function isDirectory(dir: string, isDir: boolean, isLink: boolean): Promise<boolean> {
  if (isDir) return true;
  if (!isLink) return false;
  try {
    return (await stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

/** Prefer the real path for previews, falling back to the discovered path. */
async function resolveDisplayPath(file: string): Promise<string> {
  try {
    return await realpath(file);
  } catch {
    return file;
  }
}
