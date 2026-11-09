import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SKILL_NAME,
  frontmatterBoolean,
  parseInvocation,
  parseSkillMarkdown,
  parseYamlSubset,
  splitFrontmatter,
} from '../src/frontmatter.ts';

test('plain, quoted, and core-schema scalars', () => {
  const data = parseYamlSubset(
    [
      'name: unity-cli',
      'quoted: "Value with: a colon and \\"quotes\\""',
      "single: 'it''s fine'",
      'version: 0.3.0',
      'range: ">=6000.6"',
      'enabled: true',
      'disabled: FALSE',
      'nothing: null',
      'empty:',
      'count: 42',
      'ratio: 1.5',
    ].join('\n'),
  );
  assert.deepEqual(data, {
    name: 'unity-cli',
    quoted: 'Value with: a colon and "quotes"',
    single: "it's fine",
    version: '0.3.0',
    range: '>=6000.6',
    enabled: true,
    disabled: false,
    nothing: null,
    empty: null,
    count: 42,
    ratio: 1.5,
  });
});

test('block scalars fold, clip, and strip', () => {
  const folded = parseYamlSubset(
    ['description: >-', '  Builds graph tools on 6.6+,', '  state machines on 6.7+.'].join('\n'),
  );
  assert.deepEqual(folded, { description: 'Builds graph tools on 6.6+, state machines on 6.7+.' });

  const clipped = parseYamlSubset(['description: >', '  First line', '  second line'].join('\n'));
  assert.deepEqual(clipped, { description: 'First line second line\n' });

  const literal = parseYamlSubset(['notes: |', '  line one', '  line two'].join('\n'));
  assert.deepEqual(literal, { notes: 'line one\nline two\n' });

  const paragraph = parseYamlSubset(['notes: >-', '  one', '', '  two'].join('\n'));
  assert.deepEqual(paragraph, { notes: 'one\ntwo' });
});

test('block and flow sequences', () => {
  const block = parseYamlSubset(['allowed-tools:', '  - Bash', '  - Read', '  - Write'].join('\n'));
  assert.deepEqual(block, { 'allowed-tools': ['Bash', 'Read', 'Write'] });
  const flow = parseYamlSubset('modes: [agent, ask]');
  assert.deepEqual(flow, { modes: ['agent', 'ask'] });
});

test('nested mappings at any consistent indentation', () => {
  const twoSpace = parseYamlSubset(['metadata:', '  version: 0.3.0', '  support: "https://unity.com"'].join('\n'));
  assert.deepEqual(twoSpace, { metadata: { version: '0.3.0', support: 'https://unity.com' } });
  const fourSpace = parseYamlSubset(['required_packages:', '    com.unity.industry.toolkit: ">=4.0.0"'].join('\n'));
  assert.deepEqual(fourSpace, { required_packages: { 'com.unity.industry.toolkit': '>=4.0.0' } });
});

test('comments are inert and an inline comment leaves a null value', () => {
  const data = parseYamlSubset(['# leading comment', 'name: ui # trailing', 'note: # only a comment'].join('\n'));
  assert.deepEqual(data, { name: 'ui', note: null });
});

test('fences, CRLF, and BOM are handled', () => {
  const raw = '\uFEFF---\r\nname: ui\r\ndescription: Routes UI.\r\n---\r\n# UI\r\n';
  const split = splitFrontmatter(raw);
  assert.equal(split?.yaml, 'name: ui\ndescription: Routes UI.');
  const parsed = parseSkillMarkdown(raw);
  assert.equal(parsed?.data.name, 'ui');
  assert.equal(parsed?.body, '# UI');
});

test('documents without usable frontmatter are rejected', () => {
  assert.equal(parseSkillMarkdown('# Just markdown'), undefined);
  assert.equal(splitFrontmatter('---\nname: ui\n'), undefined);
  assert.throws(() => parseSkillMarkdown('---\n- a\n---\nbody'), /not a mapping/);
  assert.throws(() => parseSkillMarkdown('---\nname: ui\n   bad: indent\n---\nbody'), /unexpected indentation/);
});

test('skill names use the registry grammar', () => {
  for (const name of ['ui', 'ui-uitk', '2d-pixel-perfect', 'unity-package-management']) {
    assert.equal(SKILL_NAME.test(name), true, name);
  }
  for (const name of ['UI', 'ui_uitk', '-ui', 'ui-', 'ui--uitk', '']) {
    assert.equal(SKILL_NAME.test(name), false, name);
  }
});

test('invocation policy maps the harness keys and rejects invalid spellings', () => {
  assert.deepEqual(parseInvocation({ name: 'ui', description: 'x' }), { modelInvocable: true, userInvocable: true });
  assert.deepEqual(parseInvocation({ 'disable-model-invocation': 'yes' }), {
    modelInvocable: false,
    userInvocable: true,
  });
  assert.deepEqual(parseInvocation({ 'user-invocable': '0' }), { modelInvocable: true, userInvocable: false });
  assert.deepEqual(parseInvocation({ 'user-invocable': 'Off' }), { modelInvocable: true, userInvocable: false });
  assert.throws(() => parseInvocation({ disableModelInvocation: true }), /use "disable-model-invocation"/);
  assert.throws(() => parseInvocation({ 'user-invocable': 'sometimes' }), /must be a boolean/);
  assert.equal(frontmatterBoolean({}, 'user-invocable'), undefined);
});
