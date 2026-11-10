import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compare, renderReport } from '../scripts/upstream.ts';
import type { UpstreamLock } from '../scripts/upstream.ts';

const lock: UpstreamLock = {
  repository: 'Unity-Technologies/unity-agent-plugin',
  ref: 'a'.repeat(40),
  version: '0.1.9-beta',
  fetchedAt: '2026-01-01T00:00:00.000Z',
  skills: {
    '2d-pixel-perfect': { files: { 'SKILL.md': 'sha-old', 'references/api.md': 'ref-old' } },
    'unity-cli': { files: { 'SKILL.md': 'cli-old' } },
  },
};

test('an unchanged tree reports no drift', () => {
  const drift = compare(lock, lock.ref, {
    '2d-pixel-perfect': { 'SKILL.md': 'sha-old', 'references/api.md': 'ref-old' },
    'unity-cli': { 'SKILL.md': 'cli-old' },
  });
  assert.equal(drift.refChanged, false);
  assert.deepEqual(drift.changed, []);
  assert.deepEqual(drift.added, []);
  assert.deepEqual(drift.removed, []);
  assert.match(renderReport(drift, lock.repository), /No skill files differ from the pin/);
});

test('changed, added, and removed skills all appear in the report', () => {
  const drift = compare(lock, 'b'.repeat(40), {
    '2d-pixel-perfect': { 'SKILL.md': 'sha-new', 'references/extra.md': 'extra' },
    'new-skill': { 'SKILL.md': 'new' },
  });
  assert.equal(drift.refChanged, true);
  assert.deepEqual(drift.changed, [
    { name: '2d-pixel-perfect', files: ['SKILL.md', 'references/api.md', 'references/extra.md'] },
  ]);
  assert.deepEqual(drift.added, ['new-skill']);
  assert.deepEqual(drift.removed, ['unity-cli']);

  const report = renderReport(drift, lock.repository);
  assert.match(report, /Upstream moved: yes/);
  assert.match(report, /`2d-pixel-perfect`: `SKILL.md`, `references\/api.md`, `references\/extra.md`/);
  assert.match(report, /`new-skill`/);
  assert.match(report, /`unity-cli`/);
  assert.match(report, /--write-lock/);
});
