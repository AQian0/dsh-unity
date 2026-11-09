import assert from 'node:assert/strict';
import { test } from 'node:test';
import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createUnitySkillReader } from '../src/skills.ts';
import type { ReaderOptions } from '../src/skills.ts';

const SKILL_DIR = fileURLToPath(new URL('../skills/', import.meta.url));

/** Collect warnings instead of printing them. */
function createLogger(): { warnings: string[]; logger: { warn(message: string): void } } {
  const warnings: string[] = [];
  return { warnings, logger: { warn: (message: string) => warnings.push(message) } };
}

/** Reader over the packaged skills, matching the plugin's defaults. */
function createReader(overrides: Partial<ReaderOptions> = {}) {
  const { warnings, logger } = createLogger();
  const reader = createUnitySkillReader({
    skillDir: SKILL_DIR,
    providerName: 'unity',
    source: 'unity',
    rank: 240,
    logger,
    ...overrides,
  });
  return { reader, warnings };
}

test('the packaged catalog exposes every skill bundle', async () => {
  const { reader, warnings } = createReader();
  const candidates = await reader.list();
  const folders = (await readdir(SKILL_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.equal(candidates.length, folders.length);
  assert.deepEqual(
    candidates.map((candidate) => candidate.name),
    folders,
  );
  assert.deepEqual(warnings, []);
});

test('every candidate carries the fields the harness registry validates', async () => {
  const { reader } = createReader();
  for (const candidate of await reader.list()) {
    assert.equal(candidate.provider, 'unity');
    assert.equal(candidate.source, 'unity');
    assert.equal(candidate.rank, 240);
    assert.match(candidate.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(candidate.description.length > 0, candidate.name);
    assert.deepEqual(candidate.invocation, { modelInvocable: true, userInvocable: true });
    assert.equal(candidate.resourceBase.kind, 'directory');
    assert.equal(candidate.resourceBase.path, join(SKILL_DIR, candidate.name));
    assert.equal(candidate.path, join(SKILL_DIR, candidate.name, 'SKILL.md'));
    await access(candidate.path);
  }
});

test('the Unity 2D skill survives its leading digit and its scalar shape', async () => {
  const { reader } = createReader();
  const candidates = await reader.list();
  const pixelPerfect = candidates.find((candidate) => candidate.name === '2d-pixel-perfect');
  assert.ok(pixelPerfect);
  const skill = await reader.load(pixelPerfect);
  assert.ok(skill);
  assert.ok(skill.content.length > 0);
  assert.match(skill.description, /pixel perfect/i);
});

test('extra authoring frontmatter fields stay out of the harness contract', async () => {
  const { reader } = createReader();
  const candidates = await reader.list();
  const physics = candidates.find((candidate) => candidate.name === 'create-2d-physics');
  const skill = await reader.load(physics);
  assert.ok(skill);
  assert.deepEqual(skill.metadata, {
    version: '0.3.0',
    support: 'https://unity.com/support-services',
  });
  const cli = await reader.load(candidates.find((candidate) => candidate.name === 'unity-cli'));
  assert.ok(cli);
  assert.equal(cli.metadata, undefined);
});

test('every skill loads with an absolute instruction path and a resource base', async () => {
  const { reader } = createReader();
  for (const candidate of await reader.list()) {
    const skill = await reader.load(candidate);
    assert.ok(skill, candidate.name);
    assert.equal(skill.name, candidate.name);
    assert.equal(skill.provider, 'unity');
    assert.equal(skill.source, 'unity');
    assert.ok(skill.content.trim().length > 0, candidate.name);
    assert.equal(skill.path?.endsWith(join(candidate.name, 'SKILL.md')), true);
    await access(skill.resourceBase.path);
  }
});

test('exclude and rank are honoured', async () => {
  const { reader } = createReader({ exclude: new Set(['unity-cli', 'ui']), rank: 300 });
  const names = (await reader.list()).map((candidate) => candidate.name);
  assert.equal(names.includes('unity-cli'), false);
  assert.equal(names.includes('ui'), false);
  assert.equal(names.includes('ui-uitk'), true);
  assert.equal((await reader.list())[0]?.rank, 300);
});

test('a missing skill directory is an empty catalog, not a failure', async () => {
  const { reader } = createReader({ skillDir: join(SKILL_DIR, 'does-not-exist') });
  assert.deepEqual(await reader.list(), []);
});

test('loading an unknown candidate returns undefined', async () => {
  const { reader } = createReader();
  assert.equal(
    await reader.load({ locator: { dir: SKILL_DIR, file: join(SKILL_DIR, 'missing', 'SKILL.md') } } as never),
    undefined,
  );
  assert.equal(await reader.load(undefined), undefined);
});

test('a malformed bundle is skipped with a warning instead of failing discovery', async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(join(tmpdir(), 'dsh-unity-test-'));
  try {
    await mkdir(join(dir, 'broken'));
    await writeFile(join(dir, 'broken', 'SKILL.md'), '# no frontmatter\n');
    await mkdir(join(dir, 'nameless'));
    await writeFile(join(dir, 'nameless', 'SKILL.md'), '---\ndescription: no name\n---\nbody\n');
    const { reader, warnings } = createReader({ skillDir: dir });
    assert.deepEqual(await reader.list(), []);
    assert.equal(warnings.length, 2);
    assert.match(warnings[0], /no YAML frontmatter/);
    assert.match(warnings[1], /kebab-case name and a description/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
