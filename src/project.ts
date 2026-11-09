/**
 * Unity project detection.
 *
 * A session's working directory may sit anywhere inside a Unity project, so the
 * plugin walks up to the nearest ancestor that carries
 * `ProjectSettings/ProjectVersion.txt` — the marker Unity itself writes and the
 * same file that names the editor version. From there it reads the facts that
 * decide whether a skill applies: the editor version, the UPM packages in
 * `Packages/manifest.json`, the inferred render pipeline, whether an Editor holds
 * the project lock, and whether the `unity` CLI is on `PATH`.
 *
 * Everything here is read-only and best-effort. A partially readable project is
 * reported with the fields it does have; a directory that is not a Unity project
 * reports `undefined` rather than throwing.
 *
 * @module dsh-unity/lib/project
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/** Relative path of the file that identifies a Unity project root. */
export const PROJECT_MARKER = join('ProjectSettings', 'ProjectVersion.txt');

/** Render pipeline inferred from the installed packages. */
export type RenderPipeline = 'hdrp' | 'urp' | 'builtin';

/** What detection learned about one project. */
export interface ProjectFacts {
  readonly root: string;
  readonly editorVersion?: string;
  readonly packages?: Map<string, string>;
  readonly renderPipeline?: RenderPipeline;
  readonly editorOpen: boolean;
  readonly cliAvailable: boolean;
}

/** Collaborators a detection call can substitute, used by tests. */
export interface DetectOptions {
  readonly stat?: typeof stat;
  readonly readFile?: (path: string) => Promise<string>;
  readonly maxDepth?: number;
  readonly resolveExecutable?: (command: string) => Promise<string | undefined>;
}

/** Render-pipeline package ids, in the order that decides the answer. */
const PIPELINE_PACKAGES: ReadonlyArray<readonly [string, RenderPipeline]> = [
  ['com.unity.render-pipelines.high-definition', 'hdrp'],
  ['com.unity.render-pipelines.universal', 'urp'],
];

/** Project-relative skill roots that a project may use to override a skill. */
const PROJECT_SKILL_ROOTS = [join('.dsh', 'skills'), join('.agents', 'skills')] as const;

/** How many ancestor directories detection walks before giving up. */
const DEFAULT_MAX_DEPTH = 8;

/**
 * Find the nearest ancestor containing the Unity project marker.
 *
 * @param cwd - directory to start from.
 * @param options - injectable filesystem and walk depth.
 * @returns the absolute project root, or `undefined` when there is none.
 */
export async function findProjectRoot(cwd: string, options: DetectOptions = {}): Promise<string | undefined> {
  const statFile = options.stat ?? stat;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  let current = resolve(cwd);
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    try {
      const info = await statFile(join(current, PROJECT_MARKER));
      if (info.isFile()) return current;
    } catch {
      // Not a project at this level; keep walking up.
    }
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
  return undefined;
}

/**
 * Read the editor version from `ProjectVersion.txt`.
 *
 * @param text - file contents.
 * @returns the version such as `6000.3.14f1`, or `undefined` when absent.
 */
export function parseProjectVersion(text: string): string | undefined {
  const match = /^\s*m_EditorVersion:\s*(\S+)\s*$/m.exec(text);
  return match?.[1];
}

/**
 * Read installed UPM packages from a manifest.
 *
 * @param text - `Packages/manifest.json` contents.
 * @returns package id to version, or `undefined` when the manifest is not a mapping.
 */
export function parsePackages(text: string): Map<string, string> | undefined {
  try {
    const manifest = JSON.parse(text) as { dependencies?: unknown };
    const dependencies = manifest?.dependencies;
    if (typeof dependencies !== 'object' || dependencies === null || Array.isArray(dependencies)) return undefined;
    const packages = new Map<string, string>();
    for (const [name, version] of Object.entries(dependencies as Record<string, unknown>)) {
      if (typeof version === 'string') packages.set(name, version.trim());
    }
    return packages;
  } catch {
    return undefined;
  }
}

/**
 * Infer the render pipeline from installed packages.
 *
 * @param packages - installed packages, or `undefined` when unknown.
 * @returns the pipeline name, or `undefined` when the package list is unknown.
 */
export function inferRenderPipeline(packages: Map<string, string> | undefined): RenderPipeline | undefined {
  if (packages === undefined) return undefined;
  for (const [id, pipeline] of PIPELINE_PACKAGES) {
    if (packages.has(id)) return pipeline;
  }
  return 'builtin';
}

/**
 * Detect the Unity project that contains a directory.
 *
 * @param cwd - session working directory.
 * @param options - injectable collaborators and walk depth.
 * @returns project facts, or `undefined` outside a project.
 */
export async function detectProject(cwd: string, options: DetectOptions = {}): Promise<ProjectFacts | undefined> {
  if (typeof cwd !== 'string' || cwd === '') return undefined;
  const statFile = options.stat ?? stat;
  const readText = options.readFile ?? ((path: string) => readFile(path, 'utf8'));
  const root = await findProjectRoot(cwd, { ...options, stat: statFile });
  if (root === undefined) return undefined;

  let editorVersion: string | undefined;
  try {
    editorVersion = parseProjectVersion(await readText(join(root, PROJECT_MARKER)));
  } catch {
    editorVersion = undefined;
  }

  let packages: Map<string, string> | undefined;
  try {
    packages = parsePackages(await readText(join(root, 'Packages', 'manifest.json')));
  } catch {
    packages = undefined;
  }

  let editorOpen = false;
  try {
    editorOpen = (await statFile(join(root, 'Temp', 'UnityLockfile'))).isFile();
  } catch {
    editorOpen = false;
  }

  let cliAvailable = false;
  if (typeof options.resolveExecutable === 'function') {
    try {
      cliAvailable = (await options.resolveExecutable('unity')) !== undefined;
    } catch {
      cliAvailable = false;
    }
  }

  return {
    root,
    ...(editorVersion === undefined ? {} : { editorVersion }),
    ...(packages === undefined ? {} : { packages }),
    renderPipeline: inferRenderPipeline(packages),
    editorOpen,
    cliAvailable,
  };
}

/**
 * Skill names a project provides itself, which this plugin must not shadow.
 *
 * @param root - project root.
 * @param options - injectable filesystem.
 * @returns skill names found under the project skill roots.
 */
export async function readProjectSkillNames(
  root: string,
  options: { readdir?: typeof readdir; stat?: typeof stat } = {},
): Promise<Set<string>> {
  const listDir = options.readdir ?? readdir;
  const statFile = options.stat ?? stat;
  const names = new Set<string>();
  for (const relative of PROJECT_SKILL_ROOTS) {
    let entries;
    try {
      entries = await listDir(join(root, relative), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      try {
        const info = await statFile(join(root, relative, entry.name, 'SKILL.md'));
        if (info.isFile()) names.add(entry.name);
      } catch {
        // A directory without SKILL.md is not a skill override.
      }
    }
  }
  return names;
}

/**
 * A short, stable identity for a fact set, used to notice project changes.
 *
 * @param facts - detected facts.
 * @returns a cache and comparison key.
 */
export function factsKey(facts: ProjectFacts | undefined): string {
  if (facts === undefined) return 'none';
  const packages =
    facts.packages === undefined
      ? '?'
      : [...facts.packages.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([id, version]) => `${id}@${version}`)
          .join(',');
  return [
    facts.root,
    facts.editorVersion ?? '?',
    facts.renderPipeline ?? '?',
    facts.editorOpen ? 'open' : 'closed',
    packages,
  ].join('|');
}
