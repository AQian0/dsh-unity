import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  detectProject,
  factsKey,
  findProjectRoot,
  inferRenderPipeline,
  parsePackages,
  parseProjectVersion,
  readProjectSkillNames,
} from '../src/project.ts';

/** Create a temporary Unity project and return its root. */
async function createProject({
  version = '6000.3.14f1',
  packages,
  lock = false,
}: { version?: string; packages?: Record<string, string> | null; lock?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-unity-project-'));
  await mkdir(join(root, 'ProjectSettings'), { recursive: true });
  await writeFile(
    join(root, 'ProjectSettings', 'ProjectVersion.txt'),
    `m_EditorVersion: ${version}\nm_EditorVersionWithRevision: ${version} (abcdef123456)\n`,
  );
  if (packages !== null && packages !== undefined) {
    await mkdir(join(root, 'Packages'), { recursive: true });
    await writeFile(join(root, 'Packages', 'manifest.json'), JSON.stringify({ dependencies: packages }, null, 2));
  }
  if (lock) {
    await mkdir(join(root, 'Temp'), { recursive: true });
    await writeFile(join(root, 'Temp', 'UnityLockfile'), '');
  }
  return root;
}

test('ProjectVersion.txt supplies the editor version', () => {
  assert.equal(parseProjectVersion('m_EditorVersion: 6000.3.14f1\n'), '6000.3.14f1');
  assert.equal(parseProjectVersion('m_EditorVersionWithRevision: 6000.3.14f1 (abcdef)\n'), undefined);
  assert.equal(parseProjectVersion('nonsense'), undefined);
});

test('manifest parsing keeps package versions and tolerates junk', () => {
  const parsed = parsePackages('{"dependencies":{"com.unity.ugui":"2.0.0","local":"file:../x"}}');
  assert.ok(parsed);
  assert.deepEqual(
    [...parsed.entries()],
    [
      ['com.unity.ugui', '2.0.0'],
      ['local', 'file:../x'],
    ],
  );
  assert.equal(parsePackages('not json'), undefined);
  assert.equal(parsePackages('{"dependencies":[]}'), undefined);
});

test('render pipeline is inferred from the installed packages', () => {
  assert.equal(inferRenderPipeline(new Map([['com.unity.render-pipelines.universal', '14.0.11']])), 'urp');
  assert.equal(inferRenderPipeline(new Map([['com.unity.render-pipelines.high-definition', '17.0.3']])), 'hdrp');
  assert.equal(inferRenderPipeline(new Map([['com.unity.ugui', '2.0.0']])), 'builtin');
  assert.equal(inferRenderPipeline(undefined), undefined);
});

test('detection walks up from a nested directory', async () => {
  const root = await createProject({ packages: { 'com.unity.render-pipelines.universal': '14.0.11' }, lock: true });
  try {
    const nested = join(root, 'Assets', 'Scripts');
    await mkdir(nested, { recursive: true });
    assert.equal(await findProjectRoot(nested), root);
    const facts = await detectProject(nested, { resolveExecutable: async () => '/usr/local/bin/unity' });
    assert.ok(facts);
    assert.equal(facts.root, root);
    assert.equal(facts.editorVersion, '6000.3.14f1');
    assert.equal(facts.renderPipeline, 'urp');
    assert.equal(facts.editorOpen, true);
    assert.equal(facts.cliAvailable, true);
    assert.equal(facts.packages?.get('com.unity.render-pipelines.universal'), '14.0.11');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a directory outside any project reports undefined', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-unity-plain-'));
  try {
    assert.equal(await detectProject(root), undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a project without a manifest still reports its editor version', async () => {
  const root = await createProject({ packages: null });
  try {
    const facts = await detectProject(root);
    assert.ok(facts);
    assert.equal(facts.editorVersion, '6000.3.14f1');
    assert.equal(facts.packages, undefined);
    assert.equal(facts.renderPipeline, undefined);
    assert.equal(facts.editorOpen, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a corrupt manifest costs the package facts, not detection', async () => {
  const root = await createProject();
  try {
    await mkdir(join(root, 'Packages'), { recursive: true });
    await writeFile(join(root, 'Packages', 'manifest.json'), '{ not json');
    const facts = await detectProject(root);
    assert.ok(facts);
    assert.equal(facts.root, root);
    assert.equal(facts.packages, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('project skill roots are discovered so the project keeps its own versions', async () => {
  const root = await createProject();
  try {
    for (const [relative, name] of [
      [join('.dsh', 'skills'), 'ui-uitk'],
      [join('.agents', 'skills'), 'unity-cli'],
    ]) {
      await mkdir(join(root, relative, name), { recursive: true });
      await writeFile(join(root, relative, name, 'SKILL.md'), '---\nname: x\ndescription: y\n---\n');
    }
    await mkdir(join(root, '.dsh', 'skills', 'not-a-skill'), { recursive: true });
    const names = await readProjectSkillNames(root);
    assert.deepEqual([...names].sort(), ['ui-uitk', 'unity-cli']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('factsKey changes when the facts that drive gating change', async () => {
  const root = await createProject({ packages: { 'com.unity.ugui': '2.0.0' } });
  try {
    const before = await detectProject(root);
    assert.ok(before);
    const after = { ...before, editorVersion: '6000.6.0f1' };
    assert.notEqual(factsKey(before), factsKey(after));
    assert.equal(factsKey(before), factsKey({ ...before }));
    assert.equal(factsKey(undefined), 'none');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
