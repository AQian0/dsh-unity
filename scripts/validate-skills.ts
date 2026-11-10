#!/usr/bin/env node
/**
 * Audit the packaged Unity skills against the DeepSeek Harness skill rules.
 *
 * The validator deliberately drives the plugin's own code path instead of a
 * private re-implementation: discovery and loading go through
 * `createUnitySkillReader` from `../src/skills.ts`, so a skill that the plugin
 * would silently skip shows up here as a failure. Parsing goes through
 * `parseSkillMarkdown` from `../src/frontmatter.ts`. The skills live in this
 * package and are edited here, so the audit asks one question only: can the
 * harness discover and load them? It never compares against an external tree.
 *
 * Usage:
 *   node scripts/validate-skills.ts [skillsDir] [--report <file>]
 *
 * Exit code 0 when every check passes, 1 on any failure. Warnings (missing
 * optional resource files, unusual frontmatter keys, ...) never change the exit
 * code.
 *
 * @module dsh-unity/scripts/validate-skills
 */

import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

import { load as loadYaml } from 'js-yaml';

import { SKILL_NAME, parseSkillMarkdown, splitFrontmatter } from '../src/frontmatter.ts';
import { readRequirements, satisfiesRange } from '../src/requirements.ts';
import { createUnitySkillReader } from '../src/skills.ts';

/** Repository root, derived from this script so the validator works from any cwd. */

/** One failed check. */
interface Finding {
  readonly file: string;
  readonly check: string;
  readonly message: string;
}

/** One skill's collected facts, rendered as a console line and a report row. */
interface SkillRow {
  folder: string;
  name: string;
  description: string;
  descriptionLength: number;
  extras: string[];
  bodyChars: number;
  requirements?: string[];
  readonly file: string;
}

/** Parsed command-line options. */
interface CliOptions {
  skillsDir: string;
  report?: string;
  positional?: string;
  only?: string[];
  help: boolean;
}

/** Digest of one run, consumed by both renderers. */
interface Summary {
  skills: number;
  passed: number;
  failedSkills: number;
  candidates: number;
  loaded: number;
  failures: number;
  warnings: number;
  providerWarnings: number;
  references: number;
  referencesResolved: number;
  referenceWarnings: number;
  largestBody: number;
  failureCounts: Record<string, number>;
  extrasKeys: string[];
  extrasSkills: number;
  failuresList: Finding[];
  warningsList: Finding[];
  providerWarningsList: string[];
  rows: SkillRow[];
  skillsDir: string;
}

/** Frontmatter keys the DSH skill provider understands itself. */
const STANDARD_KEYS = new Set(['name', 'description', 'whenToUse', 'disable-model-invocation', 'user-invocable']);

/**
 * The DSH tool-result pruner trims any result above 8192 code points once a
 * compaction trigger qualifies, so a skill body must stay below that line.
 * Keep a margin for the `<skill_content>` wrapper and resource guidance.
 */
const BODY_SIZE_FAIL_CHARS = 8192;

/** Warn earlier so a body does not drift up to the hard limit unnoticed. */
const BODY_SIZE_WARN_CHARS = 7000;

/** `dsh-tool-skill` caps a catalog description at 500 characters by default. */
const DESCRIPTION_WARN_CHARS = 500;

/** Directory prefixes that make a reference unambiguously skill-relative. */
const RESOURCE_PREFIX = /^(?:references|scripts|assets|examples|resources)\//;

/** Inline code span that is exactly one skill-relative path. */
const RESOURCE_SPAN = /^(?:references|scripts|assets|examples|resources)\/[A-Za-z0-9_./-]+\/?$/;

/** Characters that mark a template or glob rather than a literal path. */
const NON_LITERAL = /[*<>{}()[\]$\\]/;

/**
 * A mention that the surrounding prose explicitly says does not exist, such as
 * "(no `references/index.md` or README hub)" in setup-multiplayer-services.
 */
const NEGATED_PREFIX = /(?:\bno\b|\bnot\b|\bwithout\b|\bnever\b|n['\u2019]t\b)[^,;)\n]{0,80}$/i;

/** Skill-relative link target, including a trailing `#anchor`. */
function normalizeReference(target: string): string {
  return target.replace(/#.*$/u, '').replace(/[.,;:!?]+$/u, '');
}

/**
 * Whether a candidate path token should be treated as a skill-relative resource.
 *
 * @param {string} token - normalized token.
 * @returns {boolean} true for literal paths under a known resource directory.
 */
function isSkillRelativePath(token: string): boolean {
  return RESOURCE_PREFIX.test(token) && !NON_LITERAL.test(token);
}

/**
 * Collect every skill-relative resource reference from a Markdown body.
 *
 * Three shapes are recognized: Markdown link targets, inline code spans that
 * are exactly one path, and bare prose paths such as `scripts/Foo.cs`. Mentions
 * the sentence marks as absent are skipped.
 *
 * @param {string[]} lines - body lines.
 * @param {number} firstLineNumber - file line number of `lines[0]`.
 * @returns {Map<string, number>} reference path to first mentioning line.
 */
function collectReferences(lines: readonly string[], firstLineNumber: number): Map<string, number> {
  const references = new Map<string, number>();
  const note = (path: string, index: number): void => {
    if (!references.has(path)) references.set(path, firstLineNumber + index);
  };
  lines.forEach((line, index) => {
    // Markdown link targets: [label](references/file.md#anchor)
    for (const match of line.matchAll(/\]\(([^)\s]+)/gu)) {
      const path = normalizeReference(match[1]);
      if (isSkillRelativePath(path) && !NEGATED_PREFIX.test(line.slice(0, match.index))) {
        note(path, index);
      }
    }
    // Inline code spans: `references/file.md`
    for (const match of line.matchAll(/`([^`\n]+)`/gu)) {
      const path = normalizeReference(match[1]);
      if (RESOURCE_SPAN.test(path) && !NEGATED_PREFIX.test(line.slice(0, match.index))) {
        note(path, index);
      }
    }
    // Bare prose paths, with links and code spans removed to avoid double reads.
    const prose = line.replace(/\[[^\]]*\]\([^)]*\)/gu, '').replace(/`[^`\n]+`/gu, '');
    for (const match of prose.matchAll(
      /(?<![\w/.:-])((?:references|scripts|assets|examples|resources)\/[A-Za-z0-9_./-]+)/gu,
    )) {
      const path = normalizeReference(match[1]);
      if (isSkillRelativePath(path) && !NEGATED_PREFIX.test(prose.slice(0, match.index))) {
        note(path, index);
      }
    }
  });
  return references;
}

/** Follow symlinks when deciding whether a directory entry is a skill folder. */
async function isDirectoryEntry(
  parent: string,
  entry: { name: string; isDirectory(): boolean; isSymbolicLink(): boolean },
): Promise<boolean> {
  if (entry.isDirectory()) return true;
  if (!entry.isSymbolicLink()) return false;
  try {
    return (await stat(join(parent, entry.name))).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Entry point.
 *
 * @returns process exit code.
 */
async function main(): Promise<number> {
  let options: CliOptions;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}\n`);
    return 2;
  }
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const skillsDir = resolve(options.skillsDir);

  const failures: Finding[] = [];
  const warnings: Finding[] = [];
  const providerWarnings: string[] = [];
  const rows: SkillRow[] = [];
  const fail = (file: string, check: string, message: string): void => {
    failures.push({ file, check, message });
  };
  const warn = (file: string, check: string, message: string): void => {
    warnings.push({ file, check, message });
  };

  // ---------------------------------------------------------------------------
  // Directory shape: every skill folder must carry SKILL.md.
  // ---------------------------------------------------------------------------
  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch (error) {
    process.stderr.write(`cannot read skills directory ${skillsDir}: ${String(error)}\n`);
    return 1;
  }
  const rootFiles = entries.filter((entry) => !entry.isDirectory() && !entry.isSymbolicLink());
  for (const entry of rootFiles) {
    warn(join(skillsDir, entry.name), 'layout', 'file is not a skill folder and is not served by the provider');
  }
  const folders: string[] = [];
  for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
    if (await isDirectoryEntry(skillsDir, entry)) folders.push(entry.name);
  }
  const requested = options.only === undefined ? undefined : new Set(options.only);
  if (requested !== undefined) {
    const unknown = [...requested].filter((name) => !folders.includes(name));
    if (unknown.length > 0) {
      process.stderr.write(`unknown skill folder(s): ${unknown.join(', ')}\n`);
      return 2;
    }
  }
  const selected = requested === undefined ? folders : folders.filter((name) => requested.has(name));
  if (selected.length === 0) {
    process.stderr.write(`no skill folders found under ${skillsDir}\n`);
    return 1;
  }

  // ---------------------------------------------------------------------------
  // Per-skill content checks, parsed through the plugin's own frontmatter reader.
  // ---------------------------------------------------------------------------
  let referencedTotal = 0;
  let referencedResolved = 0;
  const skillRecords = new Map();

  for (const folder of selected) {
    const dir = join(skillsDir, folder);
    const file = join(dir, 'SKILL.md');
    const row: SkillRow = {
      folder,
      name: '',
      description: '',
      descriptionLength: 0,
      extras: [],
      bodyChars: 0,
      file,
    };
    rows.push(row);
    skillRecords.set(folder, row);

    let fileInfo;
    try {
      fileInfo = await stat(file);
    } catch {
      fail(file, 'SKILL.md', 'skill folder has no SKILL.md');
      continue;
    }
    if (!fileInfo.isFile()) {
      fail(file, 'SKILL.md', 'SKILL.md is not a regular file');
      continue;
    }

    const raw = await readFile(file, 'utf8');
    let parsed;
    try {
      parsed = parseSkillMarkdown(raw);
    } catch (error) {
      fail(file, 'frontmatter', `frontmatter does not parse with src/frontmatter.ts: ${String(error)}`);
      continue;
    }
    if (parsed === undefined) {
      fail(file, 'frontmatter', 'document has no YAML frontmatter fence');
      continue;
    }
    const { data, body } = parsed;

    // Cross-check the self-contained subset reader against a strict YAML parser:
    // a document that parses here but not with a real parser would be dropped by
    // agents even though this validator accepted it.
    const frontmatterSource = splitFrontmatter(raw);
    if (frontmatterSource !== undefined) {
      try {
        const strict = loadYaml(frontmatterSource.yaml);
        if (typeof strict !== 'object' || strict === null || Array.isArray(strict)) {
          fail(file, 'frontmatter', 'a strict YAML parser reads the frontmatter as a non-mapping');
        } else {
          const strictMapping = strict as Record<string, unknown>;
          const strictKeys = Object.keys(strictMapping).sort().join(',');
          const subsetKeys = Object.keys(data).sort().join(',');
          if (strictKeys !== subsetKeys) {
            fail(file, 'frontmatter', `strict YAML keys (${strictKeys}) differ from the subset reader (${subsetKeys})`);
          }
          if (strictMapping.name !== data.name || strictMapping.description !== data.description) {
            fail(file, 'frontmatter', 'strict YAML and the subset reader disagree on name or description');
          }
        }
      } catch (error) {
        fail(file, 'frontmatter', `a strict YAML parser rejects the frontmatter: ${String(error).split('\n')[0]}`);
      }
    }

    const name = typeof data.name === 'string' ? data.name.trim() : '';
    row.name = name;
    if (typeof data.name !== 'string') {
      fail(file, 'name', `frontmatter name must be a string, got ${typeName(data.name)}`);
    } else if (!SKILL_NAME.test(name)) {
      fail(file, 'name', `name "${name}" is not kebab-case (${SKILL_NAME})`);
    } else if (name !== folder) {
      fail(file, 'name', `name "${name}" does not match folder "${folder}"`);
    }

    const description = typeof data.description === 'string' ? data.description.trim() : '';
    row.description = description;
    row.descriptionLength = description.length;
    if (typeof data.description !== 'string') {
      fail(file, 'description', `frontmatter description must be a string, got ${typeName(data.description)}`);
    } else if (description.length === 0) {
      fail(file, 'description', 'frontmatter description is empty');
    } else if (description.includes('<') || description.includes('>')) {
      fail(file, 'description', 'frontmatter description contains "<" or ">"');
    } else if (description.length > DESCRIPTION_WARN_CHARS) {
      warn(
        file,
        'description',
        `description is ${description.length} characters; dsh-tool-skill caps the catalog at ${DESCRIPTION_WARN_CHARS} by default`,
      );
    }

    if (body.trim() === '') {
      fail(file, 'body', 'skill body is empty');
    }

    row.extras = Object.keys(data)
      .filter((key) => !STANDARD_KEYS.has(key))
      .sort();

    // Body size matters: a loaded skill body is a tool result, and an oversized one
    // gets trimmed head/tail once a compaction trigger qualifies.
    row.bodyChars = [...body].length;
    if (row.bodyChars > BODY_SIZE_FAIL_CHARS) {
      fail(
        file,
        'size',
        `SKILL.md body is ${row.bodyChars} characters; the DSH pruner trims results above ${BODY_SIZE_FAIL_CHARS}`,
      );
    } else if (row.bodyChars > BODY_SIZE_WARN_CHARS) {
      warn(
        file,
        'size',
        `SKILL.md body is ${row.bodyChars} characters; keep it under ${BODY_SIZE_WARN_CHARS} so the wrapper still fits`,
      );
    }

    // Requirement declarations drive project-aware gating, so they must be readable.
    const requirements = readRequirements(data);
    if (requirements.editor !== undefined && satisfiesRange(requirements.editor, '6000.0.0f1') === undefined) {
      warn(file, 'requirements', `required_editor_version "${requirements.editor}" cannot be parsed as a range`);
    }
    for (const requirement of requirements.packages) {
      if (requirement.range !== '' && satisfiesRange(requirement.range, '1.0.0') === undefined) {
        warn(
          file,
          'requirements',
          `required_packages "${requirement.name}" range "${requirement.range}" cannot be parsed`,
        );
      }
    }
    if (requirements.editor !== undefined || requirements.packages.length > 0) {
      row.requirements = [
        ...(requirements.editor === undefined ? [] : [`unity ${requirements.editor}`]),
        ...requirements.packages.map((entry) => `${entry.name} ${entry.range}`.trim()),
      ];
    }

    // Resource references are warnings: several are optional by design.
    const split = splitFrontmatter(raw);
    if (split !== undefined) {
      const yamlLines = split.yaml === '' ? 0 : split.yaml.split('\n').length;
      const bodyLines = split.body.split('\n');
      const references = collectReferences(bodyLines, yamlLines + 3);
      for (const [reference, line] of references) {
        referencedTotal += 1;
        const target = resolve(join(dir, reference));
        let inside = target === dir || target.startsWith(`${dir}${sep}`);
        if (!inside) {
          warn(file, 'reference', `line ${line}: "${reference}" resolves outside the skill folder`);
          continue;
        }
        let info;
        try {
          info = await stat(target);
        } catch {
          warn(file, 'reference', `line ${line}: referenced path "${reference}" does not exist`);
          continue;
        }
        if (!info.isFile() && !info.isDirectory()) {
          warn(file, 'reference', `line ${line}: "${reference}" is neither a file nor a directory`);
          continue;
        }
        referencedResolved += 1;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Provider checks: discovery and loading must agree with the files on disk.
  // ---------------------------------------------------------------------------
  const reader = createUnitySkillReader({
    skillDir: skillsDir,
    providerName: 'unity',
    source: 'unity',
    rank: 240,
    logger: { warn: (message) => providerWarnings.push(message) },
  });

  let candidates: Awaited<ReturnType<typeof reader.list>> = [];
  try {
    candidates = await reader.list();
  } catch (error) {
    fail(skillsDir, 'provider.list', `createUnitySkillReader.list() threw: ${String(error)}`);
  }

  const candidateByDir = new Map();
  for (const candidate of candidates) {
    const dir = resolve(candidate.locator?.dir ?? '');
    if (candidateByDir.has(dir)) {
      fail(candidate.locator?.file ?? dir, 'provider.list', 'provider advertised two candidates for one folder');
      continue;
    }
    candidateByDir.set(dir, candidate);
  }

  const names = new Map();
  for (const candidate of candidates) {
    const group = names.get(candidate.name) ?? [];
    group.push(candidate);
    names.set(candidate.name, group);
  }
  for (const [name, group] of names) {
    if (group.length < 2) continue;
    for (const candidate of group) {
      fail(
        candidate.locator?.file ?? skillsDir,
        'unique names',
        `skill name "${name}" is advertised ${group.length} times`,
      );
    }
  }

  let loaded = 0;
  for (const folder of selected) {
    const row = skillRecords.get(folder);
    const candidate = candidateByDir.get(resolve(join(skillsDir, folder)));
    if (candidate === undefined) {
      fail(
        join(skillsDir, folder, 'SKILL.md'),
        'provider.list',
        'folder is not advertised by createUnitySkillReader.list()',
      );
      continue;
    }
    if (candidate.name !== folder) {
      fail(
        candidate.locator.file,
        'provider.list',
        `provider advertises name "${candidate.name}" for folder "${folder}"`,
      );
    }
    if (candidate.description.trim() === '') {
      fail(candidate.locator.file, 'provider.list', 'provider advertised an empty description');
    }
    if (row.description !== candidate.description) {
      fail(candidate.locator.file, 'provider.list', 'provider description differs from parsed frontmatter');
    }
    let skill;
    try {
      skill = await reader.load(candidate);
    } catch (error) {
      fail(candidate.locator.file, 'provider.load', `createUnitySkillReader.load() threw: ${String(error)}`);
      continue;
    }
    if (skill === undefined) {
      fail(candidate.locator.file, 'provider.load', 'createUnitySkillReader.load() returned undefined');
      continue;
    }
    loaded += 1;
    if (typeof skill.content !== 'string' || skill.content.trim() === '') {
      fail(candidate.locator.file, 'provider.load', 'loaded skill has an empty body');
    }
    if (skill.name !== candidate.name || skill.description !== candidate.description) {
      fail(candidate.locator.file, 'provider.load', 'loaded name/description differ from the advertised candidate');
    }
    if (skill.invocation?.modelInvocable !== true || skill.invocation?.userInvocable !== true) {
      warn(
        candidate.locator.file,
        'provider.load',
        `invocation policy is not fully open (${JSON.stringify(skill.invocation)})`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Summary and report.
  // ---------------------------------------------------------------------------
  const failedSkills = rows.filter((row) => failureUnder(failures, join(skillsDir, row.folder))).length;
  const countFailures = (...checks: string[]): number =>
    failures.filter((failure) => checks.includes(failure.check)).length;
  const referenceWarnings = warnings.filter((warning) => warning.check === 'reference').length;
  const extras = new Map();
  for (const row of rows) {
    for (const key of row.extras) extras.set(key, (extras.get(key) ?? 0) + 1);
  }

  const summary = {
    skills: rows.length,
    passed: rows.length - failedSkills,
    failedSkills,
    candidates: candidates.length,
    loaded,
    failures: failures.length,
    warnings: warnings.length,
    providerWarnings: providerWarnings.length,
    references: referencedTotal,
    referencesResolved: referencedResolved,
    referenceWarnings,
    failureCounts: {
      layout: countFailures('SKILL.md', 'layout'),
      frontmatter: countFailures('frontmatter'),
      name: countFailures('name'),
      description: countFailures('description'),
      unique: countFailures('unique names'),
      body: countFailures('body'),
      providerList: countFailures('provider.list'),
      providerLoad: countFailures('provider.load'),
    },
    largestBody: rows.reduce((largest, row) => Math.max(largest, row.bodyChars ?? 0), 0),
    extrasKeys: [...extras.keys()].sort(),
    extrasSkills: rows.filter((row) => row.extras.length > 0).length,
    failuresList: failures,
    warningsList: warnings,
    providerWarningsList: providerWarnings,
    rows,
    skillsDir,
  };

  process.stdout.write(renderConsole(summary));
  if (options.report !== undefined) {
    const reportPath = resolve(options.report);
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, renderMarkdown(summary), 'utf8');
    process.stdout.write(`\nreport written to ${reportPath}\n`);
  }
  return failures.length === 0 ? 0 : 1;
}

/** Type name for diagnostics. */
function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/** CLI usage text. */
const USAGE = `Usage: node scripts/validate-skills.ts [skillsDir] [--only <names>] [--report <file>]

  skillsDir        directory holding skill bundles (default: ./skills)
  --only <names>   comma-separated skill folder names to check
  --report <file>  also write the Markdown audit report to this path

Exit code 0 when every failure check passes, 1 on failures, 2 on usage errors.`;

/**
 * Parse command-line arguments.
 *
 * @param {string[]} argv - arguments after the script name.
 * @returns {{ skillsDir: string, report?: string, positional?: string, help: boolean }} options.
 */
function parseArguments(argv: readonly string[]): CliOptions {
  const options: CliOptions = { skillsDir: 'skills', help: false, positional: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--only') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) throw new Error(`${argument} needs a value`);
      options.only = [...(options.only ?? []), ...value.split(',').filter((name) => name !== '')];
      index += 1;
    } else if (argument === '--report') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) throw new Error(`${argument} needs a value`);
      options.report = value;
      index += 1;
    } else if (argument.startsWith('-')) {
      throw new Error(`unknown option ${argument}`);
    } else if (options.positional === undefined) {
      options.skillsDir = argument;
      options.positional = argument;
    } else {
      throw new Error(`unexpected argument ${argument}`);
    }
  }
  return options;
}

/**
 * Whether any recorded failure belongs to a skill folder.
 *
 * @param {Array<{ file: string }>} failures - recorded failures.
 * @param {string} dir - absolute skill folder.
 * @returns {boolean} true when a failure path is inside that folder.
 */
function failureUnder(failures: readonly Finding[], dir: string): boolean {
  return failures.some((failure) => failure.file === dir || failure.file.startsWith(`${dir}${sep}`));
}

/**
 * Render the console summary.
 *
 * @param {object} summary - collected results.
 * @returns text for stdout.
 */
function renderConsole(summary: Summary): string {
  const lines = [];
  lines.push(`Unity skill audit — ${summary.skillsDir}`);
  lines.push('');
  for (const row of summary.rows) {
    const failed = failureUnder(summary.failuresList, join(summary.skillsDir, row.folder));
    const status = failed ? 'FAIL' : 'PASS';
    const extras = row.extras.length === 0 ? '-' : row.extras.join(',');
    lines.push(
      `${status}  ${row.folder.padEnd(48)} name=${row.name || '(none)'}  desc=${String(row.descriptionLength).padStart(3)}ch  extras=${extras}`,
    );
  }
  lines.push('');
  if (summary.failuresList.length > 0) {
    lines.push(`FAILURES (${summary.failuresList.length}):`);
    for (const failure of summary.failuresList) {
      lines.push(`  ${failure.file} [${failure.check}] ${failure.message}`);
    }
    lines.push('');
  }
  if (summary.warningsList.length > 0) {
    lines.push(`WARNINGS (${summary.warningsList.length}):`);
    for (const warning of summary.warningsList) {
      lines.push(`  ${warning.file} [${warning.check}] ${warning.message}`);
    }
    lines.push('');
  }
  if (summary.providerWarningsList.length > 0) {
    lines.push(`PROVIDER WARNINGS (${summary.providerWarningsList.length}):`);
    for (const message of summary.providerWarningsList) lines.push(`  ${message}`);
    lines.push('');
  }
  lines.push('SUMMARY');
  lines.push(`  skills:              ${summary.passed}/${summary.skills} passed, ${summary.failedSkills} failed`);
  lines.push(`  provider:            ${summary.candidates} candidates listed, ${summary.loaded} loaded`);
  lines.push(`  references:          ${summary.referencesResolved}/${summary.references} resolved`);
  lines.push(`  largest body:        ${summary.largestBody} chars`);
  lines.push(
    `  frontmatter extras:  ${summary.extrasKeys.length} keys across ${summary.extrasSkills} skills (informational)`,
  );
  lines.push(`  failures:            ${summary.failures}`);
  lines.push(`  warnings:            ${summary.warnings}`);
  lines.push(`  result:              ${summary.failures === 0 ? 'PASS' : 'FAIL'}`);
  return `${lines.join('\n')}\n`;
}

/** Escape a value for a Markdown table cell. */
function cell(value: unknown): string {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

/**
 * Render the Markdown audit report.
 *
 * @param {object} summary - collected results.
 * @returns {string} report source.
 */
function renderMarkdown(summary: Summary): string {
  const lines = [];
  lines.push('# Unity skill audit');
  lines.push('');
  lines.push('Audit of the packaged Unity skills against DeepSeek Harness skill rules.');
  lines.push('');
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Node: ${process.version}`);
  lines.push(`- Skills directory: \`${summary.skillsDir}\``);
  lines.push(`- Validator: \`scripts/validate-skills.ts\` (\`pnpm run validate\`)`);
  lines.push('');
  lines.push('Discovery and loading are exercised through `createUnitySkillReader` from `src/skills.ts`');
  lines.push('and frontmatter parsing through `parseSkillMarkdown` from `src/frontmatter.ts`, so the audit');
  lines.push('measures what the harness itself would see.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Skills audited: **${summary.skills}**`);
  lines.push(`- Passed: **${summary.passed}**; failed: **${summary.failedSkills}**`);
  lines.push(`- Failures: **${summary.failures}**; warnings: **${summary.warnings}**`);
  lines.push(
    `- Provider path: **${summary.candidates}/${summary.skills}** candidates listed and **${summary.loaded}/${summary.skills}** skills loaded`,
  );
  lines.push(`- Skill-relative references: **${summary.referencesResolved}/${summary.references}** resolved on disk`);
  lines.push(
    `- Informational non-standard frontmatter keys: **${summary.extrasKeys.length}** keys across **${summary.extrasSkills}** skills`,
  );
  lines.push('');
  lines.push('## Checks');
  lines.push('');
  lines.push('| Check | Result | Detail |');
  lines.push('| --- | --- | --- |');
  const status = (count: number, word = 'failure'): string =>
    count === 0 ? 'pass' : `${count} ${word}${count === 1 ? '' : 's'}`;
  const checks = summary.failureCounts;
  lines.push(`| SKILL.md in every skill folder | ${status(checks.layout)} | ${summary.skills} folders |`);
  lines.push(
    `| Frontmatter parses (\`parseSkillMarkdown\`) | ${status(checks.frontmatter)} | ${summary.skills} skills |`,
  );
  lines.push(`| Name is kebab-case and matches folder | ${status(checks.name)} | ${summary.skills} skills |`);
  lines.push(
    `| Description non-empty and free of \`<\`/\`>\` | ${status(checks.description)} | ${summary.skills} skills |`,
  );
  lines.push(
    `| Skill names unique | ${status(checks.unique)} | ${new Set(summary.rows.map((row) => row.name)).size} distinct names |`,
  );
  lines.push(`| Body non-empty | ${status(checks.body)} | ${summary.skills} skills |`);
  lines.push(
    `| Provider discovery (\`list\`) | ${status(checks.providerList)} | ${summary.candidates}/${summary.skills} candidates |`,
  );
  lines.push(
    `| Provider load (\`load\`) | ${status(checks.providerLoad)} | ${summary.loaded}/${summary.skills} loaded |`,
  );
  lines.push(
    `| Skill-relative references resolve | ${status(summary.referenceWarnings, 'warning')} | ${summary.referencesResolved}/${summary.references} resolved |`,
  );
  lines.push('');
  lines.push('## Skills');
  lines.push('');
  lines.push('| Skill folder | Parsed name | Description chars | Extra frontmatter keys |');
  lines.push('| --- | --- | --- | --- |');
  for (const row of summary.rows) {
    lines.push(
      `| \`${cell(row.folder)}\` | \`${cell(row.name || '—')}\` | ${row.descriptionLength} | ${row.extras.length === 0 ? '—' : row.extras.map((key) => `\`${cell(key)}\``).join(', ')} |`,
    );
  }
  lines.push('');
  lines.push('## Informational frontmatter keys');
  lines.push('');
  if (summary.extrasKeys.length === 0) {
    lines.push('None.');
  } else {
    lines.push('These keys are authored for the original Claude/Codex/Antigravity loaders. DSH reads `name`,');
    lines.push('`description`, `whenToUse`, `disable-model-invocation`, and `user-invocable`; `metadata` is');
    lines.push('forwarded as skill metadata; the remaining keys are tolerated and ignored. They are reported');
    lines.push('for information and are **not** failures.');
    lines.push('');
    lines.push('| Key | Skills using it |');
    lines.push('| --- | --- |');
    for (const key of summary.extrasKeys) {
      const skills = summary.rows.filter((row) => row.extras.includes(key)).map((row) => `\`${row.folder}\``);
      lines.push(`| \`${cell(key)}\` | ${skills.join(', ')} |`);
    }
  }
  lines.push('');
  lines.push('## Warnings');
  lines.push('');
  if (summary.warningsList.length === 0 && summary.providerWarningsList.length === 0) {
    lines.push('None.');
  } else {
    for (const warning of summary.warningsList) {
      lines.push(`- \`${warning.file}\` [${warning.check}]: ${warning.message}`);
    }
    for (const message of summary.providerWarningsList) {
      lines.push(`- Provider warning: ${message}`);
    }
  }
  lines.push('');
  lines.push('## Failures');
  lines.push('');
  if (summary.failuresList.length === 0) {
    lines.push('None.');
  } else {
    for (const failure of summary.failuresList) {
      lines.push(`- \`${failure.file}\` [${failure.check}]: ${failure.message}`);
    }
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

try {
  const code = await main();
  process.exitCode = code;
} catch (error) {
  process.stderr.write(
    `validate-skills failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
}
