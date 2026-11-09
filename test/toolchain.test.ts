/**
 * Toolchain wiring for the pnpm + Vite+ setup.
 *
 * The package has no Vite application: `vite-plus` only supplies the local `vp`
 * CLI (Oxfmt + Oxlint), TypeScript does the building, and Node runs the tests.
 * These files therefore have to agree with each other — the `packageManager`
 * pin, the exact devDependencies, the pnpm settings, the committed lockfile, the
 * Vite+ config, and the ignore/editor settings that Oxfmt inherits.
 *
 * The tests read the files instead of importing the toolchain, and parse YAML
 * through the plugin's own subset reader (src/frontmatter.ts) because the
 * package deliberately ships no parser dependency.
 *
 * @module test/toolchain
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseYamlSubset } from '../src/frontmatter.ts';
import type { YamlMapping, YamlValue } from '../src/frontmatter.ts';

const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));

/** An exact semver, i.e. a devDependency with no `^`, `~`, or tag. */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** The package.json fields these tests rely on. */
interface PackageJson {
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files?: string[];
  scripts?: Record<string, string>;
}

/** Read a file that must exist at the repository root. */
function readRepoFile(relativePath: string): string {
  try {
    return readFileSync(join(REPO_ROOT, relativePath), 'utf8');
  } catch (error) {
    assert.fail(`cannot read ${relativePath} from the repository root: ${(error as Error).message}`);
  }
}

/** Narrow a parsed YAML value to a mapping with a file-and-key message. */
function expectMapping(value: YamlValue | undefined, label: string): YamlMapping {
  assert.ok(
    value !== undefined && typeof value === 'object' && value !== null && !Array.isArray(value),
    `${label} must be a YAML mapping`,
  );
  return value;
}

/** Read a mapping entry, tolerating the quotes pnpm writes around scoped names. */
function mappingEntry(mapping: YamlMapping, key: string): YamlValue | undefined {
  for (const candidate of [key, `'${key}'`, `"${key}"`]) {
    if (Object.hasOwn(mapping, candidate)) return mapping[candidate];
  }
  return undefined;
}

/** A mapping entry that must exist and must itself be a mapping. */
function childMapping(mapping: YamlMapping, key: string, label: string): YamlMapping {
  return expectMapping(mappingEntry(mapping, key), `${label}.${key}`);
}

/** A mapping entry that must exist and must be a string scalar. */
function childString(mapping: YamlMapping, key: string, label: string): string {
  const value = mappingEntry(mapping, key);
  assert.ok(typeof value === 'string', `${label}.${key} must be a string`);
  return value;
}

/** Strip the quotes pnpm puts around a scoped package name. */
function unquoteKey(key: string): string {
  const quoted = /^(['"])(.+)\1$/.exec(key);
  return quoted === null ? key : quoted[2];
}

/** Parse every document of a (possibly multi-document) YAML file as a mapping. */
function parseYamlDocuments(source: string, label: string): YamlMapping[] {
  const documents: YamlMapping[] = [];
  let pending: string[] = [];
  const flush = (): void => {
    if (pending.some((line) => line.trim() !== '')) {
      documents.push(expectMapping(parseYamlSubset(pending.join('\n')), label));
    }
    pending = [];
  };
  for (const line of source.split('\n')) {
    if (/^---\s*$/.test(line)) flush();
    else pending.push(line);
  }
  flush();
  return documents;
}

/**
 * Parse the committed lockfile.
 *
 * pnpm 12 records the managed pnpm dependency in a leading document and writes
 * the project lockfile in the next one, so merge the documents: the project
 * importer is then found whether pnpm writes one document or two.
 */
function parseLockfile(source: string): YamlMapping {
  const documents = parseYamlDocuments(source, 'pnpm-lock.yaml');
  assert.ok(documents.length > 0, 'pnpm-lock.yaml must contain at least one YAML document');
  return Object.assign({}, ...documents);
}

/** Read a script body, failing with its path when the script is missing. */
function scriptBody(name: string): string {
  const body = scripts[name];
  assert.ok(typeof body === 'string' && body.length > 0, `package.json scripts must define "${name}"`);
  return body;
}

const packageJson = JSON.parse(readRepoFile('package.json')) as PackageJson;
const devDependencies: Record<string, string> = packageJson.devDependencies ?? {};
const scripts: Record<string, string> = packageJson.scripts ?? {};
const workspaceDocuments = parseYamlDocuments(readRepoFile('pnpm-workspace.yaml'), 'pnpm-workspace.yaml');
const workspace: YamlMapping = workspaceDocuments[0] ?? {};
const lockfile = parseLockfile(readRepoFile('pnpm-lock.yaml'));
const gitignore = readRepoFile('.gitignore');
const editorconfig = readRepoFile('.editorconfig');

test('packageManager pins the pnpm release the lockfile was written for', () => {
  assert.equal(
    packageJson.packageManager,
    'pnpm@12.16.1',
    'package.json must pin pnpm through "packageManager": "pnpm@12.16.1"',
  );
});

test('the toolchain devDependencies are exact versions', () => {
  const expected: Record<string, string> = {
    '@types/node': '26.6.5',
    typescript: '7.0.2',
    'vite-plus': '1.5.0',
  };
  for (const [name, version] of Object.entries(expected)) {
    assert.equal(devDependencies[name], version, `package.json devDependencies must pin ${name} to exactly ${version}`);
  }
  for (const [name, version] of Object.entries(devDependencies)) {
    assert.match(
      version,
      EXACT_VERSION,
      `package.json devDependencies.${name} must be an exact version, not the range "${version}"`,
    );
  }
});

test('the package declares no runtime dependencies', () => {
  assert.equal(
    packageJson.dependencies,
    undefined,
    'package.json must not declare "dependencies": the plugin runs inside the harness and ships its toolchain as devDependencies',
  );
});

test('pnpm aliases every vite request to the bundled vite-plus core', () => {
  const overrides = childMapping(workspace, 'overrides', 'pnpm-workspace.yaml');
  const alias = childString(overrides, 'vite@*', 'pnpm-workspace.yaml overrides');
  const vitePlusVersion = devDependencies['vite-plus'];
  assert.ok(vitePlusVersion !== undefined, 'package.json devDependencies must declare vite-plus');
  const prefix = 'npm:@voidzero-dev/vite-plus-core@';
  assert.ok(alias.startsWith(prefix), `overrides["vite@*"] must alias vite to the core package ("${alias}")`);
  assert.equal(
    alias.slice(prefix.length),
    vitePlusVersion,
    'overrides["vite@*"] must alias the same version as the "vite-plus" devDependency',
  );
});

test('pnpm pins vitest to the single runner the lockfile resolves', () => {
  const overrides = childMapping(workspace, 'overrides', 'pnpm-workspace.yaml');
  const pin = childString(overrides, 'vitest@*', 'pnpm-workspace.yaml overrides');
  assert.match(pin, /^\d+\.\d+\.\d+$/, `overrides["vitest@*"] must pin a concrete version, not the range "${pin}"`);
  const resolved = new Set<string>();
  for (const section of ['packages', 'snapshots']) {
    for (const key of Object.keys(childMapping(lockfile, section, 'pnpm-lock.yaml'))) {
      const entry = /^vitest@(.+)$/.exec(key);
      if (entry === null) continue;
      resolved.add(entry[1].split('(')[0]);
    }
  }
  assert.deepEqual(
    [...resolved],
    [pin],
    `pnpm-lock.yaml must resolve exactly the pinned vitest ${pin}, not ${[...resolved].join(', ')}`,
  );
});

test('pnpm lets the aliased vite satisfy the vitest peer range', () => {
  const rules = childMapping(workspace, 'peerDependencyRules', 'pnpm-workspace.yaml');
  const allowed = childMapping(rules, 'allowedVersions', 'pnpm-workspace.yaml peerDependencyRules');
  assert.equal(
    childString(allowed, 'vite', 'pnpm-workspace.yaml peerDependencyRules.allowedVersions'),
    '*',
    'peerDependencyRules.allowedVersions.vite must be "*" so the aliased vite core passes the peer check',
  );
});

test('the lockfile importer agrees with the declared devDependencies', () => {
  const packages = childMapping(lockfile, 'packages', 'pnpm-lock.yaml');
  const snapshots = childMapping(lockfile, 'snapshots', 'pnpm-lock.yaml');
  const importers = childMapping(lockfile, 'importers', 'pnpm-lock.yaml');
  const importer = childMapping(importers, '.', 'pnpm-lock.yaml importers');
  const locked = childMapping(importer, 'devDependencies', 'pnpm-lock.yaml importers["."]');
  assert.deepEqual(
    Object.keys(locked).map(unquoteKey).sort(),
    Object.keys(devDependencies).sort(),
    'pnpm-lock.yaml importers["."].devDependencies must record exactly the devDependencies package.json declares',
  );
  for (const [name, version] of Object.entries(devDependencies)) {
    const label = `pnpm-lock.yaml importers["."].devDependencies.${name}`;
    const entry = childMapping(locked, name, 'pnpm-lock.yaml importers["."].devDependencies');
    assert.equal(
      childString(entry, 'specifier', label),
      version,
      `the lockfile must record the declared specifier of ${name}`,
    );
    assert.equal(
      childString(entry, 'version', label).split('(')[0],
      version,
      `the lockfile must resolve ${name} to the exact version ${version}`,
    );
    assert.ok(
      mappingEntry(packages, `${name}@${version}`) !== undefined ||
        mappingEntry(snapshots, `${name}@${version}`) !== undefined,
      `pnpm-lock.yaml must resolve ${name}@${version} in its packages or snapshots`,
    );
  }
});

test('the repository keeps exactly one package-manager lockfile', () => {
  assert.equal(existsSync(join(REPO_ROOT, 'pnpm-lock.yaml')), true, 'pnpm-lock.yaml must be committed');
  assert.equal(
    existsSync(join(REPO_ROOT, 'package-lock.json')),
    false,
    'package-lock.json must not exist: pnpm-lock.yaml is the only committed lockfile',
  );
});

test('.gitignore keeps dependencies, build output and foreign lockfiles out of history', () => {
  const entries = gitignore
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  for (const entry of ['node_modules/', 'lib/', 'package-lock.json', 'yarn.lock', '.npmrc']) {
    assert.ok(entries.includes(entry), `.gitignore must ignore ${entry}`);
  }
});

test('.editorconfig fixes the whitespace Oxfmt inherits', () => {
  const settings = new Map<string, string>();
  for (const line of editorconfig.split('\n')) {
    const assignment = /^([a-z_]+)\s*=\s*(.*)$/.exec(line.trim());
    if (assignment !== null) settings.set(assignment[1], assignment[2].trim());
  }
  assert.equal(settings.get('indent_size'), '2', '.editorconfig must set indent_size = 2');
  assert.equal(settings.get('end_of_line'), 'lf', '.editorconfig must set end_of_line = lf');
});

test('the package scripts expose the full pnpm + Vite+ gate', () => {
  const required = [
    'build',
    'clean',
    'prepack',
    'prepublishOnly',
    'format',
    'format:check',
    'lint',
    'lint:fix',
    'check',
    'check:fix',
    'typecheck',
    'test',
    'test:unit',
    'test:coverage',
    'validate',
  ];
  for (const name of required) {
    assert.ok(
      typeof scripts[name] === 'string' && scripts[name].length > 0,
      `package.json scripts must define "${name}"`,
    );
  }
});

test('the test gate runs check, then typecheck, then the unit tests', () => {
  const steps = scriptBody('test')
    .split('&&')
    .map((step) => step.trim());
  const stepIndex = (pattern: RegExp): number => steps.findIndex((step) => pattern.test(step));
  const check = stepIndex(/(?:^|\s)check$/);
  const typecheck = stepIndex(/(?:^|\s)typecheck$/);
  const unit = stepIndex(/test:unit$/);
  assert.ok(check !== -1, 'scripts.test must run the lint/format gate "pnpm run check"');
  assert.ok(typecheck !== -1, 'scripts.test must run "pnpm run typecheck"');
  assert.ok(unit !== -1, 'scripts.test must run "pnpm run test:unit"');
  assert.ok(check < typecheck, 'scripts.test must run check before typecheck');
  assert.ok(typecheck < unit, 'scripts.test must run typecheck before test:unit');
});

test('format, lint and check all route through the local Vite+ CLI', () => {
  assert.ok(scriptBody('format').startsWith('vp fmt'), 'scripts.format must run the Vite+ formatter (vp fmt)');
  assert.ok(
    scriptBody('format:check').startsWith('vp fmt') && scriptBody('format:check').includes('--check'),
    'scripts["format:check"] must run "vp fmt --check"',
  );
  assert.ok(scriptBody('lint').startsWith('vp lint'), 'scripts.lint must run the Vite+ linter (vp lint)');
  assert.ok(
    scriptBody('lint:fix').startsWith('vp lint') && scriptBody('lint:fix').includes('--fix'),
    'scripts["lint:fix"] must run "vp lint --fix"',
  );
  assert.ok(
    scriptBody('check').includes('vp check --deny-warnings'),
    'scripts.check must run "vp check --deny-warnings" so warnings fail the gate',
  );
  assert.ok(
    scriptBody('check:fix').startsWith('vp check') && scriptBody('check:fix').includes('--fix'),
    'scripts["check:fix"] must run "vp check --fix"',
  );
  assert.ok(scriptBody('typecheck').includes('tsc'), 'scripts.typecheck must stay on tsc');
  assert.ok(scriptBody('test:unit').includes('node --test'), 'scripts["test:unit"] must stay on node --test');
});

test('packing and publishing run the full gate', () => {
  const publish = scriptBody('prepublishOnly');
  assert.ok(/\btest\b/.test(publish), 'scripts.prepublishOnly must run the test gate');
  assert.ok(/\bvalidate\b/.test(publish), 'scripts.prepublishOnly must run validate');
  assert.ok(/\bbuild\b/.test(scriptBody('prepack')), 'scripts.prepack must build the package before packing');
});

test('vite.config.ts is the single source of the fmt and lint rules', () => {
  const configPath = join(REPO_ROOT, 'vite.config.ts');
  assert.equal(existsSync(configPath), true, 'vite.config.ts must exist at the repository root');
  const config = readFileSync(configPath, 'utf8');
  assert.match(
    config,
    /import\s*\{\s*defineConfig\s*\}\s*from\s*['"]vite-plus['"]/,
    "vite.config.ts must import defineConfig from 'vite-plus'",
  );
  const formatBlock = /^ {2}fmt: \{([\s\S]*?)^ {2}\},/m.exec(config);
  assert.ok(formatBlock !== null, 'vite.config.ts must configure a fmt block');
  const lintBlock = /^ {2}lint: \{([\s\S]*?)^ {2}\},/m.exec(config);
  assert.ok(lintBlock !== null, 'vite.config.ts must configure a lint block');
  for (const [tool, block] of [
    ['fmt', formatBlock[1]],
    ['lint', lintBlock[1]],
  ] as const) {
    assert.match(
      block,
      /ignorePatterns:\s*\[\s*['"]skills\/\*\*['"]\s*\]/,
      `vite.config.ts ${tool}.ignorePatterns must skip skills/**: Unity ships those files verbatim`,
    );
  }
});

test('the published tarball ships no development files', () => {
  const files = packageJson.files;
  assert.ok(Array.isArray(files) && files.length > 0, 'package.json files must list what the tarball ships');
  for (const entry of files) {
    assert.equal(typeof entry, 'string', 'package.json files entries must be strings');
  }
  const forbidden: ReadonlyArray<readonly [RegExp, string]> = [
    [/^(?:src|test|scripts)\//, 'a development directory'],
    [/^tsconfig[^/]*\.json$/, 'a TypeScript config'],
    [/^vite\.config\.ts$/, 'the Vite+ config'],
    [/^pnpm-workspace\.yaml$/, 'the pnpm settings'],
  ];
  for (const entry of files) {
    for (const [pattern, description] of forbidden) {
      assert.doesNotMatch(entry, pattern, `package.json files must not ship ${description} (${entry})`);
    }
  }
  assert.ok(files.includes('lib/**/*.js'), 'package.json files must ship the built lib output');
});
