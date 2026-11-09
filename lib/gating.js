/**
 * Visibility decisions for one agent's skill catalog.
 *
 * The harness separates two questions about a skill: whether the model may see
 * and load it (`modelInvocable`) and whether a person may invoke it by name
 * (`userInvocable`). That split is exactly what project-aware gating needs: a
 * skill that does not apply to the current project should leave the model's
 * catalog to save tokens and avoid wrong suggestions, while staying reachable
 * through an explicit `/skill-name` request.
 *
 * The rules here are intentionally conservative:
 *
 * - outside a Unity project only the configured workspace skills stay visible;
 * - an unmet editor or package requirement hides the skill;
 * - an *unknown* fact never hides a skill, it only records that the check could
 *   not be made, so a broken manifest cannot silently empty the catalog;
 * - a skill the project provides itself is not offered by this plugin at all,
 *   which is what keeps a project's own customization authoritative.
 *
 * @module dsh-unity/lib/gating
 */

import { evaluateRequirements } from './requirements.js';

/**
 * Decide the model-visibility of one skill candidate.
 *
 * @param {object} candidate - skill candidate carrying `requirements`.
 * @param {object | undefined} facts - project facts from `detectProject`.
 * @param {object} settings - resolved plugin settings.
 * @returns {{ modelInvocable: boolean, reason: string | undefined }} the decision and,
 *   when hidden, a short human-readable reason.
 */
export function decideVisibility(candidate, facts, settings) {
  if (!settings.enforceRequirements) return { modelInvocable: true, reason: undefined };
  const verdict = evaluateRequirements(candidate.requirements ?? { packages: [] }, facts);
  if (!verdict.applicable) return { modelInvocable: false, reason: verdict.reasons.join('; ') };
  return { modelInvocable: true, reason: undefined };
}

/**
 * Build the catalog this plugin serves for one agent.
 *
 * Every candidate stays in the list so that a person can still invoke a hidden
 * skill by name; only its `modelInvocable` flag changes. Candidates the project
 * overrides are dropped instead, so the project's own copy wins the name.
 *
 * @param {object[]} candidates - candidates from the skill reader.
 * @param {object | undefined} facts - project facts, or `undefined` outside a project.
 * @param {object} settings - resolved plugin settings.
 * @param {Set<string>} [projectSkills] - skill names the project supplies itself.
 * @returns {{
 *   candidates: object[],
 *   hidden: Array<{ name: string, reason: string }>,
 *   projectOverridden: string[],
 * }} gated candidates and the reasons for every hidden skill.
 */
export function gateCatalog(candidates, facts, settings, projectSkills = new Set()) {
  const gated = [];
  const hidden = [];
  const projectOverridden = [];
  const workspaceOnly = facts === undefined && settings.gateByProject;

  for (const candidate of candidates) {
    if (projectSkills.has(candidate.name)) {
      projectOverridden.push(candidate.name);
      continue;
    }
    let reason;
    if (workspaceOnly && !settings.workspaceSkills.has(candidate.name)) {
      reason = 'no Unity project in this session';
    } else {
      const decision = decideVisibility(candidate, facts, settings);
      if (!decision.modelInvocable) reason = decision.reason ?? 'requirements not met';
      else if (candidate.invocation.modelInvocable !== true) reason = 'the skill disables model invocation';
    }
    if (reason === undefined) {
      gated.push(candidate);
      continue;
    }
    hidden.push({ name: candidate.name, reason });
    gated.push({ ...candidate, invocation: { ...candidate.invocation, modelInvocable: false } });
  }
  return { candidates: gated, hidden, projectOverridden };
}

/**
 * Render the runtime-context line contributed for one agent.
 *
 * Kept to one short paragraph: it is re-read on every prompt assembly, so it must
 * describe facts the model cannot infer and nothing else.
 *
 * @param {object | undefined} facts - project facts.
 * @param {Array<{ name: string, reason: string }>} hidden - gated-away skills.
 * @returns {string | undefined} context text, or `undefined` when there is nothing to say.
 */
export function renderContext(facts, hidden) {
  if (facts === undefined) return undefined;
  const pipeline = facts.renderPipeline === undefined ? '' : `, ${facts.renderPipeline.toUpperCase()}`;
  const parts = [
    `Unity project: ${facts.root} (Editor ${facts.editorVersion ?? 'unknown'}${pipeline}, Editor ${facts.editorOpen ? 'open' : 'closed'}, unity CLI ${facts.cliAvailable ? 'available' : 'not found'})`,
  ];
  if (hidden.length > 0) {
    const listed = hidden.slice(0, 6).map((entry) => `${entry.name} (${entry.reason})`);
    const rest = hidden.length - listed.length;
    parts.push(`skills hidden for this project: ${listed.join(', ')}${rest > 0 ? `, and ${rest} more` : ''}`);
  }
  return `${parts.join('. ')}.`;
}
