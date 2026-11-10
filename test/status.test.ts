import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderStatus } from '../src/status.ts';
import type { UnityStatus } from '../src/registry.ts';

const project: UnityStatus = {
  cwd: '/repo/game/Assets',
  facts: {
    root: '/repo/game',
    dshRoot: '/repo',
    editorVersion: '6000.3.14f1',
    packages: new Map([['com.unity.render-pipelines.universal', '14.0.11']]),
    renderPipeline: 'urp',
    editorOpen: true,
    cliAvailable: true,
  },
  hidden: [
    { name: 'build-gtk', reason: 'needs Unity >=6000.6 (project 6000.3.14f1)' },
    { name: 'urp-postprocessing', reason: 'missing package com.unity.render-pipelines.universal >=14.0.0' },
  ],
  total: 34,
  visible: 32,
};

test('a project status names the roots, facts, counts, and hidden reasons', () => {
  const text = renderStatus(project);
  assert.match(text, /Session directory: \/repo\/game\/Assets/);
  assert.match(text, /Unity project: \/repo\/game \(Editor 6000\.3\.14f1, URP, Editor open, unity CLI available\)/);
  assert.match(text, /DSH project root: \/repo/);
  assert.match(text, /Skills: 32 visible, 2 hidden/);
  assert.match(text, /build-gtk \(needs Unity >=6000\.6/);
  assert.match(text, /still loadable by their explicit name/);
});

test('a session outside a project explains the small workspace catalog', () => {
  const text = renderStatus({ cwd: '/tmp/plain', facts: undefined, hidden: [], total: 34, visible: 3 });
  assert.match(text, /No Unity project at or above the session directory/);
  assert.match(text, /3 of 34 skills are model-visible outside a project/);
  assert.doesNotMatch(text, /Unity project: /);
});

test('the hidden list is capped and summarized', () => {
  const hidden = Array.from({ length: 8 }, (_value, index) => ({ name: `skill-${index}`, reason: 'not applicable' }));
  const text = renderStatus({ ...project, hidden, total: 34, visible: 26 });
  assert.match(text, /and 2 more/);
});
