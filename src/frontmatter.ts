/**
 * YAML frontmatter reader for SKILL.md files.
 *
 * The skill documents use a small, well-understood subset of YAML, so the plugin
 * carries its own reader instead of a parser dependency: the package must install
 * with no build-time or run-time third-party code. Supported syntax:
 *
 * - top-level `key: value` mappings, including nested block mappings
 *   (`required_packages`, `metadata`);
 * - block sequences (`allowed-tools` followed by `- item` lines);
 * - flow sequences (`modes: [agent, ask]`);
 * - plain, single-quoted, and double-quoted scalars;
 * - literal (`|`, `|-`, `|+`) and folded (`>`, `>-`, `>+`) block scalars;
 * - full-line comments and inline ` #` comments on plain scalars.
 *
 * Scalars resolve through the YAML 1.2 core schema, matching what a full parser
 * would produce for these documents. The invocation policy uses the registry's
 * strict boolean grammar. A value this reader cannot represent is reported as a
 * syntax error so the caller can skip the skill instead of advertising a wrong
 * description.
 *
 * @module dsh-unity/lib/frontmatter
 */

/** A parsed YAML scalar, sequence, or mapping. */
export type YamlValue = string | number | boolean | null | YamlValue[] | YamlMapping;

/** A parsed YAML mapping. */
export interface YamlMapping {
  [key: string]: YamlValue;
}

/** Parsed frontmatter plus the Markdown body that follows it. */
export interface ParsedSkill {
  readonly data: YamlMapping;
  readonly body: string;
}

/** The two invocation controls the registry understands. */
export interface InvocationPolicy {
  readonly modelInvocable: boolean;
  readonly userInvocable: boolean;
}

/** Kebab-case grammar shared by the harness skill registry. */
export const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FENCE = '---';
const BLOCK_HEADER = /^([|>])([+-]?)(\d?)$/;

/**
 * Split a Markdown document into its YAML frontmatter block and body.
 *
 * @param raw - complete file text.
 * @returns the frontmatter source and body, or `undefined` without a fence.
 */
export function splitFrontmatter(raw: string): { yaml: string; body: string } | undefined {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  if (lines[0]?.trimEnd() !== FENCE) return undefined;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index]?.trimEnd() === FENCE) {
      return { yaml: lines.slice(1, index).join('\n'), body: lines.slice(index + 1).join('\n') };
    }
  }
  return undefined;
}

/**
 * Parse a SKILL.md document into frontmatter fields and body.
 *
 * @param raw - complete file text.
 * @returns parsed frontmatter and the trimmed body, or `undefined` without a fence.
 * @throws {SyntaxError} when the frontmatter is not the supported YAML subset.
 */
export function parseSkillMarkdown(raw: string): ParsedSkill | undefined {
  const split = splitFrontmatter(raw);
  if (split === undefined) return undefined;
  const data = parseYamlSubset(split.yaml);
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new SyntaxError('frontmatter is not a mapping');
  }
  return { data: data as YamlMapping, body: split.body.trim() };
}

/**
 * Parse the supported YAML subset into a plain value.
 *
 * @param source - YAML text without the surrounding fences.
 * @returns a mapping, sequence, scalar, or `null` for a `key:` without a value.
 * @throws {SyntaxError} on indentation this subset cannot represent.
 */
export function parseYamlSubset(source: string): YamlValue {
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
 * @param data - parsed frontmatter.
 * @param key - exact frontmatter key.
 * @returns the value, or `undefined` when the key is absent.
 * @throws {TypeError} when the key is present but is not a boolean spelling.
 */
export function frontmatterBoolean(data: YamlMapping, key: string): boolean | undefined {
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
 * @param data - parsed frontmatter.
 * @returns the policy; absent keys keep both surfaces permitted.
 * @throws {Error} when a legacy camelCase key is present.
 */
export function parseInvocation(data: YamlMapping): InvocationPolicy {
  const legacy: ReadonlyArray<readonly [string, string]> = [
    ['disableModelInvocation', 'disable-model-invocation'],
    ['modelInvocable', 'disable-model-invocation'],
    ['userInvocable', 'user-invocable'],
  ];
  for (const [alias, canonical] of legacy) {
    if (Object.hasOwn(data, alias)) {
      throw new Error(`frontmatter field "${alias}" is unsupported; use "${canonical}"`);
    }
  }
  return {
    modelInvocable: frontmatterBoolean(data, 'disable-model-invocation') !== true,
    userInvocable: frontmatterBoolean(data, 'user-invocable') !== false,
  };
}

interface Cursor {
  index: number;
}

/** Advance the cursor past blank lines and full-line comments. */
function skipInert(lines: string[], cursor: Cursor): void {
  while (cursor.index < lines.length) {
    const line = lines[cursor.index] ?? '';
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      cursor.index += 1;
      continue;
    }
    return;
  }
}

/** Count leading spaces of a line. */
function indentationOf(line: string): number {
  const match = /^ */.exec(line);
  return match === null ? 0 : match[0].length;
}

/** Parse one block (mapping or sequence) whose lines start at `indent`. */
function parseBlock(lines: string[], cursor: Cursor, indent: number): YamlValue {
  const first = lines[cursor.index] ?? '';
  if (/^\s*-(?:\s|$)/.test(first)) return parseSequence(lines, cursor, indent);
  return parseMapping(lines, cursor, indent);
}

/** Parse consecutive `key: value` lines at one indentation. */
function parseMapping(lines: string[], cursor: Cursor, indent: number): YamlMapping {
  const result: YamlMapping = {};
  while (true) {
    skipInert(lines, cursor);
    if (cursor.index >= lines.length) break;
    const line = lines[cursor.index] ?? '';
    const current = indentationOf(line);
    if (current < indent) break;
    if (current > indent) throw new SyntaxError(`unexpected indentation on line ${cursor.index + 1}`);
    const entry = /^([^:#][^:]*?):(?:[ \t]+(.*)|[ \t]*)$/.exec(line.slice(indent));
    if (entry === null) throw new SyntaxError(`expected "key: value" on line ${cursor.index + 1}`);
    const key = entry[1]?.trim() ?? '';
    const rest = (entry[2] ?? '').trimEnd();
    cursor.index += 1;
    result[key] = parseValue(lines, cursor, indent, rest);
  }
  return result;
}

/** Parse consecutive `- item` lines at one indentation. */
function parseSequence(lines: string[], cursor: Cursor, indent: number): YamlValue[] {
  const result: YamlValue[] = [];
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

/** Resolve the value that follows `key:` or `- `. */
function parseValue(lines: string[], cursor: Cursor, indent: number, rest: string): YamlValue {
  if (rest.startsWith('#')) return parseNestedOrNull(lines, cursor, indent);
  const block = BLOCK_HEADER.exec(rest);
  if (block !== null) return parseBlockScalar(lines, cursor, indent, block[1], block[2]);
  if (rest !== '') {
    const plain = stripComment(rest);
    return plain === '' ? parseNestedOrNull(lines, cursor, indent) : parseScalar(plain);
  }
  return parseNestedOrNull(lines, cursor, indent);
}

/** Read a nested block after `key:` when no inline value was present. */
function parseNestedOrNull(lines: string[], cursor: Cursor, indent: number): YamlValue {
  skipInert(lines, cursor);
  const next = lines[cursor.index];
  if (next === undefined) return null;
  const nestedIndent = indentationOf(next);
  if (nestedIndent <= indent) return null;
  return parseBlock(lines, cursor, nestedIndent);
}

/** Collect an indented block scalar and apply its folding and chomping. */
function parseBlockScalar(
  lines: string[],
  cursor: Cursor,
  indent: number,
  style: string | undefined,
  chomping: string | undefined,
): string {
  const collected: string[] = [];
  let blockIndent: number | undefined;
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
  const text = style === '|' ? collected.join('\n') : foldLines(collected);
  if (chomping === '-') return text;
  return collected.length === 0 ? '' : `${text}\n`;
}

/** Fold block-scalar lines: single breaks become spaces, blank lines newlines. */
function foldLines(lines: string[]): string {
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
function stripComment(text: string): string {
  const index = text.search(/\s#/);
  return index < 0 ? text.trim() : text.slice(0, index).trim();
}

/** Parse a single inline scalar: flow sequence, quoted string, or plain text. */
function parseScalar(text: string): YamlValue {
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
function resolvePlain(text: string): YamlValue {
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
function splitFlow(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quote: string | undefined;
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

/** Decode the double-quoted escapes present in these documents. */
function unescapeDouble(text: string): string {
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
