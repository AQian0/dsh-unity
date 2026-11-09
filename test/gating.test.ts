import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gateCatalog, renderContext, decideVisibility } from '../src/gating.ts';
import type { GatingSettings, HiddenSkill } from '../src/gating.ts';
import type { ProjectFacts } from '../src/project.ts';
import type { SkillCandidate, SkillRequirements } from '../src/harness.ts';

/** The gating-relevant subset of the plugin settings. */
function settings(overrides: Partial<GatingSettings> = {}): GatingSettings {
  return {
    workspaceSkills: new Set(['new-unity-project', 'unity-cli', 'unity-package-management']),
    gateByProject: true,
    enforceRequirements: true,
    ...overrides,
  };
}

/** One candidate carrying the requirements a real skill would have. */
function candidate(name: string, requirements: SkillRequirements = { packages: [] }): SkillCandidate {
  return {
    name,
    description: `${name} skill`,
    invocation: { modelInvocable: true, userInvocable: true },
    requirements,
    provider: 'unity',
    source: 'unity',
    rank: 240,
    locator: { dir: `/pkg/skills/${name}`, file: `/pkg/skills/${name}/SKILL.md` },
    resourceBase: { kind: 'directory', path: `/pkg/skills/${name}` },
    path: `/pkg/skills/${name}/SKILL.md`,
  };
}

const modernProject: ProjectFacts & { packages: Map<string, string> } = {
  root: '/Project',
  editorVersion: '6000.3.14f1',
  packages: new Map([['com.unity.ugui', '2.0.0']]),
  renderPipeline: 'builtin',
  editorOpen: false,
  cliAvailable: true,
};

test('outside a Unity project only the workspace skills stay model-visible', () => {
  const candidates = [candidate('unity-cli'), candidate('ui-uitk'), candidate('new-unity-project')];
  const result = gateCatalog(candidates, undefined, settings());
  const visible = result.candidates.filter((entry) => entry.invocation.modelInvocable).map((entry) => entry.name);
  assert.deepEqual(visible, ['unity-cli', 'new-unity-project']);
  assert.deepEqual(
    result.hidden.map((entry) => entry.name),
    ['ui-uitk'],
  );
  // Hidden skills stay in the catalog so a person can still invoke them by name.
  assert.equal(result.candidates.length, 3);
  const hiddenCandidate = result.candidates.find((entry) => entry.name === 'ui-uitk');
  assert.ok(hiddenCandidate);
  assert.equal(hiddenCandidate.invocation.userInvocable, true);
});

test('an unmet editor requirement leaves the model catalog without removing the skill', () => {
  const candidates = [candidate('build-gtk', { editor: '>=6000.6', packages: [] })];
  const result = gateCatalog(candidates, modernProject, settings());
  const gated = result.candidates[0];
  assert.ok(gated);
  assert.equal(gated.invocation.modelInvocable, false);
  assert.equal(gated.invocation.userInvocable, true);
  assert.match(result.hidden[0].reason, /needs Unity >=6000\.6 \(project 6000\.3\.14f1\)/);
});

test('a met editor requirement keeps the skill visible', () => {
  const candidates = [candidate('fix-3d-physics-collisions', { editor: '>=6000.3', packages: [] })];
  const result = gateCatalog(candidates, modernProject, settings());
  assert.equal(result.candidates[0]?.invocation.modelInvocable, true);
  assert.deepEqual(result.hidden, []);
});

test('missing packages hide the skill and name the package', () => {
  const candidates = [candidate('shader-graph-create-custom-node', { packages: [{ name: 'com.unity.shadergraph', range: '>=17.5.0' }] })];
  const result = gateCatalog(candidates, modernProject, settings());
  assert.equal(result.candidates[0]?.invocation.modelInvocable, false);
  assert.match(result.hidden[0].reason, /missing package com\.unity\.shadergraph/);
});

test('unknown facts fail open: nothing disappears because a manifest is unreadable', () => {
  const withoutManifest = { ...modernProject, packages: undefined, renderPipeline: undefined };
  const candidates = [
    candidate('shader-graph-create-custom-node', { packages: [{ name: 'com.unity.shadergraph', range: '>=17.5.0' }] }),
    candidate('build-gtk', { editor: '>=6000.6', packages: [] }),
  ];
  const result = gateCatalog(candidates, withoutManifest, settings());
  assert.equal(result.candidates[0].invocation.modelInvocable, true, 'packages unknown keeps the skill');
  assert.equal(result.candidates[1].invocation.modelInvocable, false, 'the editor version is still known');
});

test('a skill the project provides itself is not offered by this plugin', () => {
  const candidates = [candidate('ui-uitk'), candidate('unity-cli')];
  const result = gateCatalog(candidates, modernProject, settings(), new Set(['ui-uitk']));
  assert.deepEqual(result.projectOverridden, ['ui-uitk']);
  assert.deepEqual(
    result.candidates.map((entry) => entry.name),
    ['unity-cli'],
  );
});

test('switches turn individual rules off', () => {
  const candidates = [candidate('build-gtk', { editor: '>=6000.6', packages: [] })];
  const noRequirements = gateCatalog(candidates, modernProject, settings({ enforceRequirements: false }));
  assert.equal(noRequirements.candidates[0]?.invocation.modelInvocable, true);
  const noProjectGate = gateCatalog([candidate('ui-uitk')], undefined, settings({ gateByProject: false }));
  assert.equal(noProjectGate.candidates[0]?.invocation.modelInvocable, true);
});

test('decideVisibility reports a reason only when it hides', () => {
  assert.deepEqual(decideVisibility(candidate('ui-uitk'), modernProject, settings()), {
    modelInvocable: true,
    reason: undefined,
  });
});

test('the runtime context names the project and the hidden skills', () => {
  const text = renderContext(modernProject, [
    { name: 'build-gtk', reason: 'needs Unity >=6000.6 (project 6000.3.14f1)' },
    { name: 'urp-postprocessing', reason: 'missing package com.unity.render-pipelines.universal' },
  ]);
  assert.ok(text);
  assert.match(text, /^Unity project: \/Project \(Editor 6000\.3\.14f1, BUILTIN, Editor closed, unity CLI available\)\./);
  assert.match(text, /skills hidden for this project: build-gtk/);
  assert.equal(renderContext(undefined, []), undefined);
});

test('the context truncates a long hidden list', () => {
  const hidden: HiddenSkill[] = Array.from({ length: 9 }, (_value, index) => ({ name: `skill-${index}`, reason: 'x' }));
  const text = renderContext(modernProject, hidden);
  assert.ok(text);
  assert.match(text, /and 3 more/);
});
