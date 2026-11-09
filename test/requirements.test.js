import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  compareVersions,
  evaluateRequirements,
  parseVersion,
  readRequirements,
  satisfiesRange,
} from '../lib/requirements.js';

test('Unity editor versions parse with their build suffix stripped', () => {
  assert.deepEqual(parseVersion('6000.3.14f1'), { segments: [6000, 3, 14], prerelease: undefined });
  assert.deepEqual(parseVersion('2022.3.10b5'), { segments: [2022, 3, 10], prerelease: undefined });
  assert.deepEqual(parseVersion('17.5.0'), { segments: [17, 5, 0], prerelease: undefined });
  assert.deepEqual(parseVersion('1.2'), { segments: [1, 2], prerelease: undefined });
  assert.deepEqual(parseVersion('1.0.0-preview.2'), { segments: [1, 0, 0], prerelease: 'preview.2' });
  assert.equal(parseVersion('not-a-version'), undefined);
  assert.equal(parseVersion(''), undefined);
  assert.equal(parseVersion(undefined), undefined);
});

test('versions compare segment-wise and release beats prerelease', () => {
  const a = parseVersion('6000.3.14');
  const b = parseVersion('6000.6.0');
  assert.equal(compareVersions(a, b), -1);
  assert.equal(compareVersions(b, a), 1);
  assert.equal(compareVersions(parseVersion('6000.3'), parseVersion('6000.3.0')), 0);
  assert.equal(compareVersions(parseVersion('1.0.0'), parseVersion('1.0.0-preview')), 1);
});

test('editor ranges accept the shapes Unity skills use', () => {
  assert.equal(satisfiesRange('>=6000.6', '6000.6.0f1'), true);
  assert.equal(satisfiesRange('>=6000.6', '6000.3.14f1'), false);
  assert.equal(satisfiesRange('>=6000.3', '6000.3.14f1'), true);
  assert.equal(satisfiesRange('>=6000.6 <7000.0', '6000.9.1f1'), true);
  assert.equal(satisfiesRange('>=6000.6 <7000.0', '7000.0.1f1'), false);
  assert.equal(satisfiesRange('6000.3', '6000.3.14f1'), true, 'a two-part version names a release line');
  assert.equal(satisfiesRange('6000.6', '6000.3.14f1'), false);
  assert.equal(satisfiesRange('', '6000.3.14f1'), true);
});

test('package ranges support caret, tilde, and exact comparators', () => {
  assert.equal(satisfiesRange('^4.0.0', '4.7.2'), true);
  assert.equal(satisfiesRange('^4.0.0', '5.0.0'), false);
  assert.equal(satisfiesRange('~1.2.3', '1.2.9'), true);
  assert.equal(satisfiesRange('~1.2.3', '1.3.0'), false);
  assert.equal(satisfiesRange('=14.0.11', '14.0.11'), true);
  assert.equal(satisfiesRange('>=17.5.0', '17.4.0'), false);
  assert.equal(satisfiesRange('*', '0.1.0'), true);
});

test('unparseable ranges or versions report unknown instead of failing', () => {
  assert.equal(satisfiesRange('>=next', '1.0.0'), undefined);
  assert.equal(satisfiesRange('>=1.0.0', 'file:../local-package'), undefined);
  assert.equal(satisfiesRange('>=1.0.0', undefined), undefined);
});

test('requirements are read from the frontmatter shapes Unity uses', () => {
  assert.deepEqual(readRequirements({ name: 'ui', description: 'x' }), { packages: [] });
  assert.deepEqual(
    readRequirements({
      required_editor_version: '>=6000.6',
      required_packages: { 'com.unity.shadergraph': '>=17.5.0' },
    }),
    { editor: '>=6000.6', packages: [{ name: 'com.unity.shadergraph', range: '>=17.5.0' }] },
  );
  assert.deepEqual(readRequirements({ required_packages: { 'com.unity.2d.tilemap': '1.0.0' } }), {
    packages: [{ name: 'com.unity.2d.tilemap', range: '1.0.0' }],
  });
});

test('evaluateRequirements hides on a real mismatch and stays open on unknown', () => {
  const facts = {
    editorVersion: '6000.3.14f1',
    packages: new Map([
      ['com.unity.render-pipelines.universal', '14.0.11'],
    ]),
  };

  const unmetEditor = evaluateRequirements({ editor: '>=6000.6', packages: [] }, facts);
  assert.equal(unmetEditor.applicable, false);
  assert.match(unmetEditor.reasons[0], /needs Unity >=6000\.6 \(project 6000\.3\.14f1\)/);

  const metPackage = evaluateRequirements(
    { packages: [{ name: 'com.unity.render-pipelines.universal', range: '>=14.0.0' }] },
    facts,
  );
  assert.equal(metPackage.applicable, true);

  const missing = evaluateRequirements({ packages: [{ name: 'com.unity.shadergraph', range: '>=17.5.0' }] }, facts);
  assert.equal(missing.applicable, false);
  assert.match(missing.reasons[0], /missing package com\.unity\.shadergraph/);

  const unknownEditor = evaluateRequirements({ editor: '>=6000.6', packages: [] }, { packages: new Map() });
  assert.equal(unknownEditor.applicable, true);
  assert.equal(unknownEditor.unknown, true);

  const unknownPackages = evaluateRequirements({ packages: [{ name: 'x', range: '>=1.0.0' }] }, {});
  assert.equal(unknownPackages.applicable, true);
  assert.equal(unknownPackages.unknown, true);
});
