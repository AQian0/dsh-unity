/**
 * Unity version and UPM package requirement arithmetic.
 *
 * Skill frontmatter can state what the skill needs: `required_editor_version`
 * (a range such as `>=6000.6`) and `required_packages` (a map of package id to
 * range). The harness has no equivalent mechanism, so this module turns those
 * declarations into a decision the plugin can act on: is the skill applicable
 * to the project this agent is working in?
 *
 * Version parsing is deliberately tolerant: a Unity editor version like
 * `6000.3.14f1` becomes `[6000, 3, 14]` (the `f1` build suffix is information
 * about the build channel, not ordering), while a package version keeps its
 * prerelease tag when one is present. Anything unparseable is "unknown" and the
 * caller treats unknown as *do not hide* — a wrong declaration must not silently
 * remove a skill.
 *
 * @module dsh-unity/lib/requirements
 */

/** Range operators this reader understands, longest match first. */
const OPERATORS = ['>=', '<=', '>', '<', '=', '^', '~'];

/**
 * Parse a version string into comparable numeric segments.
 *
 * @param {unknown} value - raw version such as `6000.3.14f1`, `17.5.0`, `1.2`.
 * @returns {{ segments: number[], prerelease: string | undefined } | undefined}
 *   parsed version, or `undefined` when it is not a version.
 */
export function parseVersion(value) {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (text === '') return undefined;
  // Unity editor versions carry a build channel suffix: 6000.3.14f1, 2022.3.10b5.
  const match = /^v?(\d+(?:\.\d+)*)(?:[-+]([0-9A-Za-z.-]+))?$/.exec(text.replace(/[fabp]\d+$/, ''));
  if (match === null) return undefined;
  const segments = match[1].split('.').map((part) => Number(part));
  if (segments.some((segment) => !Number.isInteger(segment) || segment < 0)) return undefined;
  return { segments, prerelease: match[2] };
}

/** Compare two parsed versions, padding the shorter one with zeros. */
export function compareVersions(left, right) {
  const length = Math.max(left.segments.length, right.segments.length);
  for (let index = 0; index < length; index += 1) {
    const a = left.segments[index] ?? 0;
    const b = right.segments[index] ?? 0;
    if (a !== b) return a < b ? -1 : 1;
  }
  if (left.prerelease === right.prerelease) return 0;
  if (left.prerelease === undefined) return 1;
  if (right.prerelease === undefined) return -1;
  return left.prerelease < right.prerelease ? -1 : 1;
}

/**
 * Resolve one comparator such as `>=6000.6` against a version.
 *
 * @param {string} token - a single comparator.
 * @param {{ segments: number[], prerelease?: string }} version - candidate version.
 * @returns {boolean | undefined} the verdict, or `undefined` when the token cannot be parsed.
 */
function satisfiesToken(token, version) {
  const operator = OPERATORS.find((candidate) => token.startsWith(candidate)) ?? '';
  const body = (operator === '' ? token : token.slice(operator.length)).trim();
  if (body === '' || body === '*' || body === 'x') return true;
  const wanted = parseVersion(body);
  if (wanted === undefined) return undefined;
  // A bare `6000.6` means "this release line", i.e. >=6000.6 <6000.7 for a two-part
  // version; a full three-part version is an exact release.
  if (operator === '' || operator === '=') {
    if (wanted.segments.length < 3) return isWithinLine(version, wanted);
    return compareVersions(version, wanted) === 0;
  }
  switch (operator) {
    case '>=':
      return compareVersions(version, wanted) >= 0;
    case '>':
      return compareVersions(version, wanted) > 0;
    case '<=':
      return compareVersions(version, wanted) <= 0;
    case '<':
      return compareVersions(version, wanted) < 0;
    case '^':
      return compareVersions(version, wanted) >= 0 && compareVersions(version, caretUpperBound(wanted)) < 0;
    case '~':
      return compareVersions(version, wanted) >= 0 && compareVersions(version, tildeUpperBound(wanted)) < 0;
    default:
      return undefined;
  }
}

/** Whether a version sits inside the release line the wanted prefix names. */
function isWithinLine(version, wanted) {
  for (let index = 0; index < wanted.segments.length; index += 1) {
    if ((version.segments[index] ?? 0) !== wanted.segments[index]) return false;
  }
  return true;
}

/** `^1.2.3` allows `<2.0.0`; `^0.2.3` allows `<0.3.0`. */
function caretUpperBound(wanted) {
  const major = wanted.segments[0] ?? 0;
  const minor = wanted.segments[1] ?? 0;
  return major > 0 ? parseVersion(`${major + 1}.0.0`) : parseVersion(`0.${minor + 1}.0`);
}

/** `~1.2.3` allows `<1.3.0`. */
function tildeUpperBound(wanted) {
  const major = wanted.segments[0] ?? 0;
  const minor = wanted.segments[1] ?? 0;
  return parseVersion(`${major}.${minor + 1}.0`);
}

/**
 * Check a range against a version.
 *
 * @param {unknown} rawRange - range text, for example `>=6000.6`.
 * @param {unknown} rawVersion - version text, for example `6000.3.14f1`.
 * @returns {boolean | undefined} `undefined` when either side cannot be parsed,
 *   so the caller can treat the answer as unknown instead of hiding a skill.
 */
export function satisfiesRange(rawRange, rawVersion) {
  if (typeof rawRange !== 'string' || rawRange.trim() === '') return true;
  if (rawVersion === undefined || rawVersion === null) return undefined;
  const version = parseVersion(rawVersion);
  if (version === undefined) return undefined;
  // Comparators may be comma- or space-separated, and the operator may be
  // separated from its version (`>= 6000.6`), so normalise before splitting.
  const normalized = rawRange.replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1');
  const tokens = normalized.split(/[,\s]+/).filter((token) => token !== '');
  if (tokens.length === 0) return true;
  let unknown = false;
  for (const token of tokens) {
    const verdict = satisfiesToken(token, version);
    if (verdict === undefined) unknown = true;
    else if (verdict === false) return false;
  }
  return unknown ? undefined : true;
}

/**
 * Read the requirement declarations out of parsed skill frontmatter.
 *
 * @param {Record<string, unknown>} data - parsed SKILL.md frontmatter.
 * @returns {{ editor?: string, packages: Array<{ name: string, range: string }> }} requirements.
 */
export function readRequirements(data) {
  const editor =
    typeof data.required_editor_version === 'string'
      ? data.required_editor_version
      : typeof data.required_editor_version === 'number'
        ? String(data.required_editor_version)
        : undefined;
  const packages = [];
  const declared = data.required_packages;
  if (typeof declared === 'object' && declared !== null && !Array.isArray(declared)) {
    for (const [name, range] of Object.entries(declared)) {
      if (typeof range === 'string' || typeof range === 'number') {
        packages.push({ name, range: String(range) });
      } else if (range === null || range === '') {
        packages.push({ name, range: '' });
      }
    }
  }
  return { ...(editor === undefined ? {} : { editor }), packages };
}

/**
 * Evaluate requirements against project facts.
 *
 * @param {{ editor?: string, packages: Array<{ name: string, range: string }> }} requirements
 *   declarations from {@link readRequirements}.
 * @param {{ editorVersion?: string, packages?: Map<string, string> } | undefined} facts
 *   detected project facts; `undefined` means no project was detected.
 * @returns {{
 *   applicable: boolean,
 *   unknown: boolean,
 *   reasons: string[],
 * }} a decision; `applicable` stays true when the answer is only unknown.
 */
export function evaluateRequirements(requirements, facts) {
  const reasons = [];
  let unknown = false;
  const editorRange = requirements.editor;
  if (editorRange !== undefined) {
    if (facts?.editorVersion === undefined) {
      unknown = true;
      reasons.push(`cannot check Unity ${editorRange}: editor version unknown`);
    } else {
      const verdict = satisfiesRange(editorRange, facts.editorVersion);
      if (verdict === false) return { applicable: false, unknown, reasons: [`needs Unity ${editorRange} (project ${facts.editorVersion})`] };
      if (verdict === undefined) {
        unknown = true;
        reasons.push(`cannot check Unity ${editorRange} against ${facts.editorVersion}`);
      }
    }
  }
  for (const requirement of requirements.packages) {
    if (facts?.packages === undefined) {
      unknown = true;
      reasons.push(`cannot check ${requirement.name}: installed packages unknown`);
      continue;
    }
    const installed = facts.packages.get(requirement.name);
    if (installed === undefined) {
      return { applicable: false, unknown, reasons: [`missing package ${requirement.name}${requirement.range === '' ? '' : ` ${requirement.range}`}`] };
    }
    const verdict = satisfiesRange(requirement.range, installed);
    if (verdict === false) {
      return { applicable: false, unknown, reasons: [`needs ${requirement.name} ${requirement.range} (project ${installed})`] };
    }
    if (verdict === undefined) {
      unknown = true;
      reasons.push(`cannot check ${requirement.name} ${requirement.range} against ${installed}`);
    }
  }
  return { applicable: true, unknown, reasons };
}
