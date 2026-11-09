/**
 * YAML frontmatter reader for SKILL.md files.
 *
 * The Unity skills were authored for Claude Code, Codex, and Antigravity, whose
 * loaders use a full YAML parser. DeepSeek Harness reads skill frontmatter from
 * its own providers, so this bundle carries a deliberately small reader for the
 * subset those skills actually use:
 *
 * - top-level `key: value` mappings, including nested block mappings one or more
 *   levels deep (`required_packages`, `metadata`)
 * - block sequences (`allowed-tools` followed by `- item` lines)
 * - flow sequences (`modes: [agent, ask]`)
 * - plain, single-quoted, and double-quoted scalars
 * - literal (`|`, `|-`, `|+`) and folded (`>`, `>-`, `>+`) block scalars
 * - full-line comments and inline ` #` comments on plain scalars
 *
 * Scalars resolve through the YAML 1.2 core schema (`null`, `true`/`false`,
 * integers, and floats), which is what the built-in filesystem provider's
 * parser produces, and everything else stays a string. The invocation policy
 * still reads its two keys through {@link frontmatterBoolean} with the same
 * strict grammar the registry uses. A value this reader cannot represent is
 * reported to the caller instead of being guessed, so a malformed skill is
 * skipped with a warning rather than advertised with a wrong description.
 *
 * @module dsh-unity/lib/frontmatter
 */

/** Kebab-case grammar shared by the harness skill registry. */
export const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FENCE = '---';
const BLOCK_HEADER = /^([|>])([+-]?)(\d?)$/;

/**
 * Split a Markdown document into its YAML frontmatter block and body.
 *
 * @param {string} raw - complete file text.
 * @returns {{ yaml: string, body: string } | undefined} the frontmatter source and
 *   the Markdown body, or `undefined` when the document has no frontmatter fence.
 */
export function splitFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  if (lines[0]?.trimEnd() !== FENCE) return undefined;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index]?.trimEnd() === FENCE) {
      return {
        yaml: lines.slice(1, index).join('\n'),
        body: lines.slice(index + 1).join('\n'),
      };
    }
  }
  return undefined;
}

/**
 * Parse a SKILL.md document into frontmatter fields and body.
 *
 * @param {string} raw - complete file text.
 * @returns {{ data: Record<string, unknown>, body: string } | undefined} parsed
 *   frontmatter and the trimmed body, or `undefined` without a frontmatter fence.
 * @throws {SyntaxError} when the frontmatter is not the supported YAML subset.
 */
export function parseSkillMarkdown(raw) {
  const split = splitFrontmatter(raw);
  if (split === undefined) return undefined;
  const data = parseYamlSubset(split.yaml);
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new SyntaxError('frontmatter is not a mapping');
  }
  return { data, body: split.body.trim() };
}

/**
 * Parse the supported YAML subset into a plain JavaScript value.
 *
 * @param {string} source - YAML text without the surrounding fences.
 * @returns {unknown} mapping, sequence, scalar, or `null` for `key:` without a value.
 * @throws {SyntaxError} on indentation this subset cannot represent.
 */
export function parseYamlSubset(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const cursor = { index: 0 };
  skipInert(lines, cursor);
  if (cursor.index >= lines.length) return {};
  const value = parseBlock(lines, cursor, indentationOf(lines[cursor.index] ?? ''));
  skipInert(lines, cursor);
  if (cursor.index < lines.length) {
    throw new SyntaxError(`unexpected content on line ${cursor.index + 1}`);
  }
  return value;
}

/**
 * Read a frontmatter boolean with the registry's strict grammar.
 *
 * @param {Record<string, unknown>} data - parsed frontmatter.
 * @param {string} key - exact frontmatter key.
 * @returns {boolean | undefined} the value, or `undefined` when the key is absent.
 * @throws {TypeError} when the key is present but is not a boolean spelling.
 */
export function frontmatterBoolean(data, key) {
  if (!Object.hasOwn(data, key)) return undefined;
  const value = data[key];
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  if (typeof value === 'string') {
    switch (value.toLowerCase()) {
      case 'true':
      case 'yes':
      case 'on':
        return true;
      case 'false':
      case 'no':
      case 'off':
        return false;
      default:
        break;
    }
  }
  throw new TypeError(`frontmatter field "${key}" must be a boolean`);
}

/**
 * Resolve the invocation policy from frontmatter.
 *
 * @param {Record<string, unknown>} data - parsed frontmatter.
 * @returns {{ modelInvocable: boolean, userInvocable: boolean }} the policy; absent
 *   keys keep both surfaces permitted.
 * @throws {Error} when a legacy camelCase key is present.
 */
export function parseInvocation(data) {
  for (const [legacy, canonical] of [
    ['disableModelInvocation', 'disable-model-invocation'],
    ['modelInvocable', 'disable-model-invocation'],
    ['userInvocable', 'user-invocable'],
  ]) {
    if (Object.hasOwn(data, legacy)) {
      throw new Error(`frontmatter field "${legacy}" is unsupported; use "${canonical}"`);
    }
  }
  return {
    modelInvocable: frontmatterBoolean(data, 'disable-model-invocation') !== true,
    userInvocable: frontmatterBoolean(data, 'user-invocable') !== false,
  };
}

/** Advance the cursor past blank lines and full-line comments. */
function skipInert(lines, cursor) {
  while (cursor.index < lines.length) {
    const line = lines[cursor.index] ?? '';
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      cursor.index += 1;
      continue;
    }
    return;
  }
}

/** Count leading spaces of a line; tabs are rejected by the caller. */
function indentationOf(line) {
  const match = /^ */.exec(line);
  return match === null ? 0 : match[0].length;
}

/**
 * Parse one block (mapping or sequence) whose lines start at `indent`.
 *
 * @param {string[]} lines - frontmatter lines.
 * @param {{ index: number }} cursor - current line.
 * @param {number} indent - indentation shared by this block's lines.
 * @returns {unknown} parsed mapping, sequence, or scalar.
 */
function parseBlock(lines, cursor, indent) {
  const first = lines[cursor.index] ?? '';
  if (/^\s*-(?:\s|$)/.test(first)) return parseSequence(lines, cursor, indent);
  return parseMapping(lines, cursor, indent);
}

/** Parse consecutive `key: value` lines at one indentation. */
function parseMapping(lines, cursor, indent) {
  const result = {};
  while (true) {
    skipInert(lines, cursor);
    if (cursor.index >= lines.length) break;
    const line = lines[cursor.index] ?? '';
    const current = indentationOf(line);
    if (current < indent) break;
    if (current > indent) throw new SyntaxError(`unexpected indentation on line ${cursor.index + 1}`);
    const entry = /^([^:#][^:]*?):(?:[ \t]+(.*)|[ \t]*)$/.exec(line.slice(indent));
    if (entry === null) throw new SyntaxError(`expected "key: value" on line ${cursor.index + 1}`);
    const key = entry[1].trim();
    const rest = (entry[2] ?? '').trimEnd();
    cursor.index += 1;
    result[key] = parseValue(lines, cursor, indent, rest);
  }
  return result;
}

/** Parse consecutive `- item` lines at one indentation. */
function parseSequence(lines, cursor, indent) {
  const result = [];
  while (true) {
    skipInert(lines, cursor);
    if (cursor.index >= lines.length) break;
    const line = lines[cursor.index] ?? '';
    const current = indentationOf(line);
    if (current < indent) break;
    if (current > indent) throw new SyntaxError(`unexpected indentation on line ${cursor.index + 1}`);
    const item = /^-(?:\s+(.*)|\s*)$/.exec(line.slice(indent).trimEnd());
    if (item === null) break;
    const rest = (item[1] ?? '').trim();
    cursor.index += 1;
    if (rest === '') {
      skipInert(lines, cursor);
      const nested = lines[cursor.index];
      const nestedIndent = nested === undefined ? indent : indentationOf(nested);
      result.push(nestedIndent > indent ? parseBlock(lines, cursor, nestedIndent) : null);
      continue;
    }
    result.push(parseValue(lines, cursor, indent, rest));
  }
  return result;
}

/**
 * Resolve the value that follows `key:` or `- `.
 *
 * @param {string[]} lines - frontmatter lines.
 * @param {{ index: number }} cursor - line after the key or item marker.
 * @param {number} indent - indentation of the owning block.
 * @param {string} rest - text after the marker, trimmed.
 * @returns {unknown} the scalar, or a nested mapping when `rest` is empty.
 */
function parseValue(lines, cursor, indent, rest) {
  if (rest.startsWith('#')) return parseNestedOrNull(lines, cursor, indent);
  const block = BLOCK_HEADER.exec(rest);
  if (block !== null) return parseBlockScalar(lines, cursor, indent, block[1], block[2]);
  if (rest !== '') {
    const plain = stripComment(rest);
    if (plain === '') {
      // A value that was only a comment behaves like an empty value.
      return parseNestedOrNull(lines, cursor, indent);
    }
    return parseScalar(plain);
  }
  return parseNestedOrNull(lines, cursor, indent);
}

/** Read a nested block after `key:` when no inline value was present. */
function parseNestedOrNull(lines, cursor, indent) {
  skipInert(lines, cursor);
  const next = lines[cursor.index];
  if (next === undefined) return null;
  const nestedIndent = indentationOf(next);
  if (nestedIndent <= indent) return null;
  return parseBlock(lines, cursor, nestedIndent);
}

/** Collect an indented block scalar and apply its folding and chomping. */
function parseBlockScalar(lines, cursor, indent, style, chomping) {
  const collected = [];
  let blockIndent;
  while (cursor.index < lines.length) {
    const line = lines[cursor.index] ?? '';
    if (line.trim() === '') {
      collected.push('');
      cursor.index += 1;
      continue;
    }
    const current = indentationOf(line);
    if (current <= indent) break;
    if (blockIndent === undefined) blockIndent = current;
    collected.push(line.slice(Math.min(blockIndent, current)));
    cursor.index += 1;
  }
  while (collected.length > 0 && collected[collected.length - 1] === '') {
    collected.pop();
  }
  const text =
    style === '|' ? collected.join('\n') : foldLines(collected);
  if (chomping === '-') return text;
  return collected.length === 0 ? '' : `${text}\n`;
}

/** Fold block-scalar lines: single breaks become spaces, blank lines newlines. */
function foldLines(lines) {
  let out = '';
  let pendingBreaks = 0;
  for (const line of lines) {
    if (line === '') {
      pendingBreaks += 1;
      continue;
    }
    if (out === '') {
      out = line;
      pendingBreaks = 0;
      continue;
    }
    out += pendingBreaks > 0 ? '\n'.repeat(pendingBreaks) : ' ';
    out += line;
    pendingBreaks = 0;
  }
  return out;
}

/** Strip a ` #` inline comment from a plain scalar. */
function stripComment(text) {
  const index = text.search(/\s#/);
  return index < 0 ? text.trim() : text.slice(0, index).trim();
}

/** Parse a single inline scalar: flow sequence, quoted string, or plain text. */
function parseScalar(text) {
  if (text.startsWith('[') && text.endsWith(']')) {
    const inner = text.slice(1, -1).trim();
    if (inner === '') return [];
    return splitFlow(inner).map((item) => parseScalar(item.trim()));
  }
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    return unescapeDouble(text.slice(1, -1));
  }
  if (text.startsWith("'") && text.endsWith("'") && text.length >= 2) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  return resolvePlain(text);
}

/** Resolve a plain scalar through the YAML 1.2 core schema. */
function resolvePlain(text) {
  switch (text) {
    case 'null':
    case 'Null':
    case 'NULL':
    case '~':
      return null;
    case 'true':
    case 'True':
    case 'TRUE':
      return true;
    case 'false':
    case 'False':
    case 'FALSE':
      return false;
    default:
      break;
  }
  if (/^[-+]?\d+$/.test(text)) return Number(text);
  if (/^[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?$/.test(text)) return Number(text);
  return text;
}

/** Split flow-sequence contents on commas that are not inside quotes. */
function splitFlow(text) {
  const parts = [];
  let current = '';
  let quote;
  for (const char of text) {
    if (quote !== undefined) {
      current += char;
      if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === ',') {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

/** Decode the double-quoted escapes present in these skills. */
function unescapeDouble(text) {
  let out = '';
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char !== '\\') {
      out += char;
      continue;
    }
    const next = text[index + 1];
    index += 1;
    switch (next) {
      case 'n':
        out += '\n';
        break;
      case 't':
        out += '\t';
        break;
      case 'r':
        out += '\r';
        break;
      case '"':
        out += '"';
        break;
      case '\\':
        out += '\\';
        break;
      default:
        out += next ?? '';
        break;
    }
  }
  return out;
}
