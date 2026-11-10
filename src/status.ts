/**
 * Human-readable `/unity-status` output.
 *
 * The runtime context already tells the model the detected project facts; this
 * renderer answers the same question for the person in the session, including
 * the reasons a skill is hidden and the fact that the catalog outside a project
 * is deliberately small. It is a pure function so the format stays testable
 * without a Host, a registry, or a filesystem.
 *
 * @module dsh-unity/lib/status
 */

import type { UnityStatus } from './registry.ts';

/** How many hidden skills the status line names before summarizing the rest. */
const MAX_HIDDEN = 6;

/**
 * Render one status snapshot.
 *
 * @param status - the snapshot the registry computed for this agent.
 * @returns the command result text.
 */
export function renderStatus(status: UnityStatus): string {
  const lines: string[] = [];
  if (status.cwd !== undefined) lines.push(`Session directory: ${status.cwd}`);

  const { facts } = status;
  if (facts === undefined) {
    lines.push(
      'No Unity project at or above the session directory (looked for ProjectSettings/ProjectVersion.txt).',
      `${status.visible} of ${status.total} skills are model-visible outside a project; use the skill name explicitly for the rest.`,
    );
    return lines.join('\n');
  }

  const pipeline = facts.renderPipeline === undefined ? '' : `, ${facts.renderPipeline.toUpperCase()}`;
  lines.push(
    `Unity project: ${facts.root} (Editor ${facts.editorVersion ?? 'unknown'}${pipeline}, Editor ${
      facts.editorOpen ? 'open' : 'closed'
    }, unity CLI ${facts.cliAvailable ? 'available' : 'not found'})`,
  );
  if (facts.dshRoot !== facts.root) lines.push(`DSH project root: ${facts.dshRoot}`);
  lines.push(`Skills: ${status.visible} visible, ${status.hidden.length} hidden`);

  if (status.hidden.length > 0) {
    const listed = status.hidden.slice(0, MAX_HIDDEN).map((entry) => `${entry.name} (${entry.reason})`);
    const rest = status.hidden.length - listed.length;
    lines.push(`Hidden: ${listed.join('; ')}${rest > 0 ? `; and ${rest} more` : ''}`);
    lines.push('Hidden skills are still loadable by their explicit name.');
  }
  return lines.join('\n');
}
