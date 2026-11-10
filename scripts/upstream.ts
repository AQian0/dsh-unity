#!/usr/bin/env node
/**
 * Upstream drift check for the vendored Unity skills.
 *
 * The skills under `skills/` are a locally adapted copy of
 * `Unity-Technologies/unity-agent-plugin`; there is no way to tell whether an
 * upstream fix landed without recording which upstream commit the copy was
 * based on and which files changed since. This script owns that record:
 *
 * - `--check` compares `upstream.lock.json` with the current upstream tree and
 *   exits 1 on drift (0 when the pin is current, 2 on a network or usage
 *   failure). It never writes the workspace.
 * - `--fetch` downloads the changed upstream files under `.upstream-preview/`
 *   so a maintainer can port them by hand. It never overwrites `skills/`.
 * - `--report <file>` writes the drift report as Markdown for a pull request.
 * - `--write-lock` records the current upstream ref and per-file blob hashes
 *   after a port has landed.
 *
 * The local copy is a condensed adaptation, not a verbatim mirror, so the script
 * only reports drift; it deliberately cannot auto-merge upstream changes.
 *
 * Usage:
 *   node scripts/upstream.ts [--check | --fetch | --write-lock]
 *                            [--repo <owner/name>] [--ref <branch>]
 *                            [--report <file>]
 *
 * @module dsh-unity/scripts/upstream
 */

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, derived from this script so it works from any cwd. */
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Upstream repository the skills come from. */
const DEFAULT_REPOSITORY = 'Unity-Technologies/unity-agent-plugin';

/** Upstream branch the check follows. */
const DEFAULT_REF = 'main';

/** Lock file recording the pinned upstream commit and file identities. */
const LOCK_FILE = join(REPO_ROOT, 'upstream.lock.json');

/** Where `--fetch` writes preview files; ignored by git. */
const PREVIEW_DIR = join(REPO_ROOT, '.upstream-preview');

/** One upstream skill: its files and their git blob hashes. */
interface LockedSkill {
  readonly files: Readonly<Record<string, string>>;
}

/** The lock file shape. */
export interface UpstreamLock {
  readonly repository: string;
  readonly ref: string;
  readonly version?: string;
  readonly fetchedAt: string;
  readonly skills: Readonly<Record<string, LockedSkill>>;
}

/** One blob entry from the GitHub tree API. */
interface TreeEntry {
  readonly path: string;
  readonly type: string;
  readonly sha: string;
}

/** A skill's upstream files, keyed by path relative to the skill folder. */
type SkillTree = Record<string, string>;

/** Parsed command-line options. */
interface Options {
  readonly mode: 'check' | 'fetch' | 'lock';
  readonly repository: string;
  readonly ref: string;
  readonly report?: string;
  readonly help: boolean;
}

/** The differences between the lock and the current upstream tree. */
export interface Drift {
  readonly refChanged: boolean;
  readonly lockedRef: string;
  readonly currentRef: string;
  readonly changed: ReadonlyArray<{ readonly name: string; readonly files: readonly string[] }>;
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

/** Read a JSON file with a useful error. */
async function readJson<T>(path: string): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch (error) {
    throw new Error(`cannot read ${path}: ${String(error)}`);
  }
}

/** Build request headers, adding a token when the environment provides one. */
function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  return {
    accept: 'application/vnd.github+json',
    'user-agent': 'dsh-unity-upstream-check',
    ...(token === undefined || token === '' ? {} : { authorization: `Bearer ${token}` }),
  };
}

/** GET a URL and decode JSON, with a bounded error message. */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/** GET a URL as text. */
async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/** Resolve the upstream branch to a commit SHA. */
function resolveRef(repository: string, ref: string): string {
  const output = execFileSync('git', ['ls-remote', `https://github.com/${repository}.git`, `refs/heads/${ref}`], {
    encoding: 'utf8',
  });
  const sha = output.trim().split(/\s+/)[0];
  if (sha === undefined || !/^[0-9a-f]{40}$/u.test(sha)) {
    throw new Error(`git ls-remote did not resolve ${repository}@${ref}`);
  }
  return sha;
}

/** List the upstream skills tree at one commit. */
async function fetchSkillTree(repository: string, sha: string): Promise<Record<string, SkillTree>> {
  const tree = await fetchJson<{ tree: readonly TreeEntry[]; truncated?: boolean }>(
    `https://api.github.com/repos/${repository}/git/trees/${sha}?recursive=1`,
  );
  if (tree.truncated === true) {
    throw new Error('the GitHub tree is truncated; narrow the check to the skills/ directory');
  }
  const skills: Record<string, SkillTree> = {};
  for (const entry of tree.tree) {
    if (entry.type !== 'blob' || !entry.path.startsWith('skills/')) continue;
    const [, name, ...rest] = entry.path.split('/');
    if (name === undefined || rest.length === 0) continue;
    const skill = (skills[name] ??= {});
    skill[rest.join('/')] = entry.sha;
  }
  return skills;
}

/** Read the upstream plugin version from the pinned commit. */
async function fetchVersion(repository: string, sha: string): Promise<string | undefined> {
  try {
    const manifest = JSON.parse(
      await fetchText(`https://raw.githubusercontent.com/${repository}/${sha}/.claude-plugin/plugin.json`),
    ) as { version?: unknown };
    return typeof manifest.version === 'string' ? manifest.version : undefined;
  } catch {
    return undefined;
  }
}

/** Compare the lock with one upstream tree. */
export function compare(lock: UpstreamLock, currentRef: string, tree: Record<string, SkillTree>): Drift {
  const changed: Array<{ name: string; files: string[] }> = [];
  for (const [name, locked] of Object.entries(lock.skills)) {
    const upstream = tree[name];
    if (upstream === undefined) continue;
    const files: string[] = [];
    for (const [path, sha] of Object.entries(locked.files)) {
      if (upstream[path] !== sha) files.push(path);
    }
    for (const path of Object.keys(upstream)) {
      if (!(path in locked.files)) files.push(path);
    }
    if (files.length > 0) changed.push({ name, files: files.sort() });
  }
  const added = Object.keys(tree).filter((name) => !(name in lock.skills));
  const removed = Object.keys(lock.skills).filter((name) => !(name in tree));
  changed.sort((left, right) => left.name.localeCompare(right.name));
  added.sort();
  removed.sort();
  return {
    refChanged: lock.ref !== currentRef,
    lockedRef: lock.ref,
    currentRef,
    changed,
    added,
    removed,
  };
}

/** Render a drift report as Markdown. */
export function renderReport(drift: Drift, repository: string): string {
  const lines: string[] = [];
  lines.push('# Upstream drift report', '');
  lines.push(`Repository: \`${repository}\``, '');
  lines.push(`- Locked ref: \`${drift.lockedRef}\``);
  lines.push(`- Current upstream ref: \`${drift.currentRef}\``);
  lines.push(`- Upstream moved: ${drift.refChanged ? 'yes' : 'no'}`, '');
  if (drift.changed.length === 0 && drift.added.length === 0 && drift.removed.length === 0) {
    lines.push('No skill files differ from the pin.');
    return `${lines.join('\n')}\n`;
  }
  lines.push('## Changed skills', '');
  if (drift.changed.length === 0) lines.push('- (none)');
  for (const entry of drift.changed) {
    lines.push(`- \`${entry.name}\`: ${entry.files.map((file) => `\`${file}\``).join(', ')}`);
  }
  lines.push('', '## Added upstream skills', '');
  lines.push(drift.added.length === 0 ? '- (none)' : drift.added.map((name) => `- \`${name}\``).join('\n'));
  lines.push('', '## Removed upstream skills', '');
  lines.push(drift.removed.length === 0 ? '- (none)' : drift.removed.map((name) => `- \`${name}\``).join('\n'));
  lines.push(
    '',
    'The local skills are a condensed adaptation, so upstream files are not copied over them.',
    'Port the relevant changes by hand, then run `node scripts/upstream.ts --write-lock`.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

/** Download the changed upstream files under the preview directory. */
async function fetchPreview(repository: string, ref: string, drift: Drift): Promise<string[]> {
  const written: string[] = [];
  for (const entry of drift.changed) {
    for (const file of entry.files) {
      const url = `https://raw.githubusercontent.com/${repository}/${ref}/skills/${entry.name}/${file}`;
      const destination = join(PREVIEW_DIR, entry.name, file);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, await fetchText(url));
      written.push(destination);
    }
  }
  for (const name of drift.added) {
    const url = `https://raw.githubusercontent.com/${repository}/${ref}/skills/${name}/SKILL.md`;
    const destination = join(PREVIEW_DIR, name, 'SKILL.md');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, await fetchText(url));
    written.push(destination);
  }
  return written;
}

/** Build a lock document from the current upstream tree. */
async function buildLock(repository: string, sha: string, tree: Record<string, SkillTree>): Promise<UpstreamLock> {
  const skills: Record<string, LockedSkill> = {};
  for (const [name, files] of Object.entries(tree)) skills[name] = { files };
  const version = await fetchVersion(repository, sha);
  return {
    repository,
    ref: sha,
    ...(version === undefined ? {} : { version }),
    fetchedAt: new Date().toISOString(),
    skills,
  };
}

/** Parse command-line arguments. */
function parseArguments(argv: readonly string[]): Options {
  let mode: Options['mode'] = 'check';
  let repository = DEFAULT_REPOSITORY;
  let ref = DEFAULT_REF;
  let report: string | undefined;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === undefined) continue;
    switch (argument) {
      case '--check':
        mode = 'check';
        break;
      case '--fetch':
        mode = 'fetch';
        break;
      case '--write-lock':
        mode = 'lock';
        break;
      case '--repo':
      case '--ref':
      case '--report': {
        const value = argv[index + 1];
        if (value === undefined || value.startsWith('--')) throw new Error(`${argument} needs a value`);
        if (argument === '--repo') repository = value;
        else if (argument === '--ref') ref = value;
        else report = value;
        index += 1;
        break;
      }
      case '--help':
      case '-h':
        help = true;
        break;
      default:
        throw new Error(`unknown argument ${argument}`);
    }
  }
  return { mode, repository, ref, ...(report === undefined ? {} : { report }), help };
}

const USAGE = `Usage: node scripts/upstream.ts [--check | --fetch | --write-lock]
                              [--repo <owner/name>] [--ref <branch>] [--report <file>]

  --check        compare upstream with upstream.lock.json (default)
  --fetch        download changed upstream files under .upstream-preview/
  --write-lock   record the current upstream ref and file hashes
  --repo         upstream repository (default: ${DEFAULT_REPOSITORY})
  --ref          upstream branch (default: ${DEFAULT_REF})
  --report       also write the Markdown drift report to this path

Exit codes: 0 current, 1 drift, 2 usage or network failure.`;

/** Run the selected mode. */
async function main(): Promise<number> {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  const sha = resolveRef(options.repository, options.ref);
  const tree = await fetchSkillTree(options.repository, sha);

  if (options.mode === 'lock') {
    const lock = await buildLock(options.repository, sha, tree);
    await writeFile(LOCK_FILE, `${JSON.stringify(lock, null, 2)}\n`);
    process.stdout.write(`upstream.lock.json: ${options.repository}@${sha} (${Object.keys(tree).length} skills)\n`);
    return 0;
  }

  const lock = await readJson<UpstreamLock>(LOCK_FILE);
  const drift = compare(lock, sha, tree);
  const report = renderReport(drift, options.repository);
  if (options.report !== undefined) await writeFile(options.report, report);
  process.stdout.write(report);

  if (options.mode === 'fetch') {
    const written = await fetchPreview(options.repository, sha, drift);
    process.stdout.write(`preview files: ${written.length} under .upstream-preview/\n`);
  }

  return drift.changed.length === 0 && drift.added.length === 0 && drift.removed.length === 0 && !drift.refChanged
    ? 0
    : 1;
}

const directRun = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (directRun) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      process.stderr.write(`upstream check failed: ${String(error)}\n`);
      process.exitCode = 2;
    });
}
