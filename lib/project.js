/**
 * Unity project detection.
 *
 * A session's working directory may sit anywhere inside a Unity project, so the
 * plugin walks up to the nearest ancestor that carries
 * `ProjectSettings/ProjectVersion.txt` — the marker Unity itself writes and the
 * same file that names the editor version. From there it reads the facts that
 * decide whether a skill applies: the editor version, the UPM packages in
 * `Packages/manifest.json`, the inferred render pipeline, whether an Editor
 * holds the project lock, and whether the `unity` CLI is on `PATH`.
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

/** Render-pipeline package ids, in the order that decides the answer. */
const PIPELINE_PACKAGES = [
  ['com.unity.render-pipelines.high-definition', 'hdrp'],
  ['com.unity.render-pipelines.universal', 'urp'],
];

/** Project-relative skill roots that a project may use to override a skill. */
const PROJECT_SKILL_ROOTS = [join('.dsh', 'skills'), join('.agents', 'skills')];

/** How many ancestor directories detection walks before giving up. */
const DEFAULT_MAX_DEPTH = 8;

/**
 * Find the nearest ancestor containing the Unity project marker.
 *
 * @param {string} cwd - directory to start from.
 * @param {{ stat?: typeof stat, maxDepth?: number }} [options] - injectable fs for tests.
 * @returns {Promise<string | undefined>} absolute project root.
 */
export async function findProjectRoot(cwd, options = {}) {
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
 * @param {string} text - file contents.
 * @returns {string | undefined} version such as `6000.3.14f1`.
 */
export function parseProjectVersion(text) {
  const match = /^\s*m_EditorVersion:\s*(\S+)\s*$/m.exec(text);
  return match?.[1];
}

/**
 * Read installed UPM packages from a manifest.
 *
 * @param {string} text - `Packages/manifest.json` contents.
 * @returns {Map<string, string> | undefined} package id to version, or `undefined`
 *   when the manifest is not a mapping.
 */
export function parsePackages(text) {
  try {
    const manifest = JSON.parse(text);
    const dependencies = manifest?.dependencies;
    if (typeof dependencies !== 'object' || dependencies === null || Array.isArray(dependencies)) return undefined;
    const packages = new Map();
    for (const [name, version] of Object.entries(dependencies)) {
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
 * @param {Map<string, string> | undefined} packages - installed packages.
 * @returns {'hdrp' | 'urp' | 'builtin' | undefined} pipeline name; `undefined` when
 *   the package list itself is unknown.
 */
export function inferRenderPipeline(packages) {
  if (packages === undefined) return undefined;
  for (const [id, pipeline] of PIPELINE_PACKAGES) {
    if (packages.has(id)) return pipeline;
  }
  return 'builtin';
}

/**
 * Detect the Unity project that contains a directory.
 *
 * @param {string} cwd - session working directory.
 * @param {object} [options] - injectable collaborators for tests.
 * @param {typeof stat} [options.stat] - `fs.stat` replacement.
 * @param {typeof readFile} [options.readFile] - `fs.readFile` replacement.
 * @param {(command: string) => Promise<string>} [options.resolveExecutable] - CLI lookup,
 *   usually `ctx.subprocess.resolveExecutable`; omitted when the service is absent.
 * @param {number} [options.maxDepth] - ancestor walk limit.
 * @returns {Promise<object | undefined>} project facts, or `undefined` outside a project.
 */
export async function detectProject(cwd, options = {}) {
  if (typeof cwd !== 'string' || cwd === '') return undefined;
  const statFile = options.stat ?? stat;
  const readText = options.readFile ?? ((path) => readFile(path, 'utf8'));
  const root = await findProjectRoot(cwd, { ...options, stat: statFile });
  if (root === undefined) return undefined;

  let editorVersion;
  try {
    editorVersion = parseProjectVersion(await readText(join(root, PROJECT_MARKER)));
  } catch {
    editorVersion = undefined;
  }

  let packages;
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
    editorVersion,
    packages,
    renderPipeline: inferRenderPipeline(packages),
    editorOpen,
    cliAvailable,
  };
}

/**
 * Skill names a project provides itself, which this plugin must not shadow.
 *
 * @param {string} root - project root.
 * @param {{ readdir?: typeof readdir }} [options] - injectable fs for tests.
 * @returns {Promise<Set<string>>} skill names found under the project skill roots.
 */
export async function readProjectSkillNames(root, options = {}) {
  const listDir = options.readdir ?? readdir;
  const names = new Set();
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
        const info = await stat(join(root, relative, entry.name, 'SKILL.md'));
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
 * @param {object | undefined} facts - detected facts.
 * @returns {string} cache and comparison key.
 */
export function factsKey(facts) {
  if (facts === undefined) return 'none';
  const packages = facts.packages === undefined ? '?' : [...facts.packages.entries()].sort().map(([id, version]) => `${id}@${version}`).join(',');
  return [facts.root, facts.editorVersion ?? '?', facts.renderPipeline ?? '?', facts.editorOpen ? 'open' : 'closed', packages].join('|');
}
