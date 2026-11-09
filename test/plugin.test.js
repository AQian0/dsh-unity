import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_RANK, apply, name, resolveSettings } from '../index.js';

/** Minimal stand-in for the Cordis context the plugin receives. */
function createContext() {
  const registered = [];
  const logger = { warn: (message) => registered.warnings?.push(message) };
  const ctx = {
    logger,
    skills: {
      registerProvider(create) {
        const control = { signal: new AbortController().signal, invalidate() {} };
        registered.push(create(control));
        return () => {};
      },
    },
  };
  return { ctx, registered };
}

test('the row name and default settings match the documented contract', () => {
  assert.equal(name, 'unity-skills');
  const settings = resolveSettings({});
  assert.equal(settings.providerName, 'unity');
  assert.equal(settings.rank, DEFAULT_RANK);
  assert.equal(settings.rank, 350);
  assert.ok(settings.skillDir.endsWith('/skills'));
  assert.equal(settings.exclude.size, 0);
});

test('config is normalized and validated', () => {
  const settings = resolveSettings({ providerName: 'unity-skills-test', rank: 300, exclude: ['ui'] });
  assert.equal(settings.providerName, 'unity-skills-test');
  assert.equal(settings.rank, 300);
  assert.deepEqual([...settings.exclude], ['ui']);
  assert.throws(() => resolveSettings({ providerName: 'runtime' }), /reserved for runtime/);
  assert.throws(() => resolveSettings({ providerName: '' }), /non-empty string/);
  assert.throws(() => resolveSettings({ rank: Number.NaN }), /finite number/);
  assert.throws(() => resolveSettings({ exclude: 'ui' }), /array of skill names/);
});

test('apply registers one provider that serves the packaged catalog', async () => {
  const { ctx, registered } = createContext();
  apply(ctx, {});
  assert.equal(registered.length, 1);
  const provider = registered[0];
  assert.equal(provider.name, 'unity');

  const candidates = await provider.list({});
  assert.equal(candidates.length, 34);
  const skill = await provider.get(candidates.find((candidate) => candidate.name === 'ui-uitk'), {});
  assert.equal(skill.name, 'ui-uitk');
  assert.match(skill.content, /UI Toolkit/);
});

test('apply honours exclude so a trimmed catalog is possible', async () => {
  const { ctx, registered } = createContext();
  apply(ctx, { exclude: ['unity-cli'] });
  const names = (await registered[0].list({})).map((candidate) => candidate.name);
  assert.equal(names.includes('unity-cli'), false);
  assert.equal(names.length, 33);
});
