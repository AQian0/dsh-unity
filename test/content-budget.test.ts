import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseSkillMarkdown } from '../src/frontmatter.ts';

const SKILLS_DIR = fileURLToPath(new URL('../skills', import.meta.url));

/** The pruner's hard line: a longer tool result is trimmed once compaction runs. */
const BODY_FAIL_CHARS = 8192;

/** `dsh-tool-skill`'s default description cap. */
const DESCRIPTION_MAX_CHARS = 500;

/** DSH tool names a skill may list in its informational `allowed-tools`. */
const DSH_TOOLS = new Set(['bash', 'read', 'write', 'edit', 'glob', 'grep', 'web_fetch', 'web_search', 'skill']);

/** One parsed skill, enough to check the catalog contract. */
interface Skill {
  readonly folder: string;
  readonly bodyChars: number;
  readonly description: string;
  readonly allowedTools: readonly string[];
}

/** Read every packaged skill. */
function readSkills(): Skill[] {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const raw = readFileSync(join(SKILLS_DIR, entry.name, 'SKILL.md'), 'utf8');
      const parsed = parseSkillMarkdown(raw);
      assert.ok(parsed, `${entry.name}/SKILL.md must have parseable frontmatter`);
      const description = typeof parsed.data.description === 'string' ? parsed.data.description : '';
      const allowed = parsed.data['allowed-tools'];
      const allowedTools = Array.isArray(allowed)
        ? allowed.filter((item): item is string => typeof item === 'string')
        : typeof allowed === 'string'
          ? allowed.split(',').map((item) => item.trim())
          : [];
      return { folder: entry.name, bodyChars: [...parsed.body].length, description, allowedTools };
    });
}

const skills = readSkills();

test('every skill body fits the DSH tool-result budget', () => {
  const over = skills.filter((skill) => skill.bodyChars > BODY_FAIL_CHARS);
  assert.deepEqual(
    over.map((skill) => `${skill.folder}: ${skill.bodyChars}`),
    [],
    `bodies above ${BODY_FAIL_CHARS} characters are trimmed by dsh-tool-result-pruner`,
  );
});

test('every description fits the catalog cap', () => {
  const over = skills.filter((skill) => skill.description.length > DESCRIPTION_MAX_CHARS);
  assert.deepEqual(
    over.map((skill) => `${skill.folder}: ${skill.description.length}`),
    [],
    `descriptions above ${DESCRIPTION_MAX_CHARS} characters are truncated by dsh-tool-skill`,
  );
});

test('allowed-tools names the DSH vocabulary, not another client vocabulary', () => {
  const unknown = skills.flatMap((skill) =>
    skill.allowedTools.filter((tool) => !DSH_TOOLS.has(tool)).map((tool) => `${skill.folder}: ${tool}`),
  );
  assert.deepEqual(unknown, [], 'allowed-tools is informational in DSH, but it must not name tools that do not exist');
});
