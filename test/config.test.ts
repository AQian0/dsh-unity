import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Config } from '../src/config.ts';
import { resolveSettings } from '../src/index.ts';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

test('the exported schema fills every default the resolver uses', () => {
  const config = new Config({});
  const settings = resolveSettings({});
  assert.equal(config.providerName, settings.providerName);
  assert.equal(config.rank, settings.rank);
  assert.deepEqual([...config.workspaceSkills].sort(), [...settings.workspaceSkills].sort());
  assert.equal(config.gateByProject, settings.gateByProject);
  assert.equal(config.enforceRequirements, settings.enforceRequirements);
  assert.equal(config.injectContext, settings.injectContext);
  assert.equal(config.watchSkills, settings.watchSkills);
  assert.equal(config.respectProjectRoots, settings.respectProjectRoots);
  assert.equal(config.statusCommand, settings.statusCommand);
  assert.equal(config.rank, 600);
});

test('the schema rejects a wrong type before the plugin activates', () => {
  assert.throws(() => new Config({ providerName: 3 as never }), /expected string/);
  assert.throws(() => new Config({ exclude: 'ui' as never }), /expected array/);
  assert.throws(() => new Config({ gateByProject: 'yes' as never }), /expected boolean/);
});

test('a relative skillDir resolves against the package root, not the process cwd', () => {
  const settings = resolveSettings({ skillDir: 'skills' });
  assert.equal(settings.skillDir, join(PACKAGE_ROOT, 'skills'));
});

test('the status command follows its switch', () => {
  assert.equal(resolveSettings({}).statusCommand, true);
  assert.equal(resolveSettings({ statusCommand: false }).statusCommand, false);
});
