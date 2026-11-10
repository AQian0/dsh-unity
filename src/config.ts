/**
 * Row configuration for the Unity skill provider.
 *
 * DSH validates a plugin row's `config` with the schema a package exports as
 * `Config`; the same schema is what the Plugins page renders for editing. This
 * module is the single source of the defaults, the field documentation, and the
 * schema shape, so the loader, the settings UI, and {@link resolveSettings}
 * cannot drift apart.
 *
 * `resolveSettings` still owns the semantic checks the schema cannot express:
 * a non-empty provider name, the reserved `runtime` name, the package-relative
 * `skillDir`, and Set normalization for the two name lists.
 *
 * @module dsh-unity/lib/config
 */

import Schema from '@deepseek-ai/schemastery';

/** Provider name the registry lists this package's catalog under. */
export const DEFAULT_PROVIDER_NAME = 'unity';

/**
 * Default rank inside one scope layer.
 *
 * DSH resolves duplicate names by layer first: the nearest layer wins outright,
 * and rank only orders duplicates inside one layer. Bundled skill roots use
 * rank 600, so this provider sits after a project root (100/200) and a custom
 * root (300) when both are registered in the same layer, which is the desired
 * outcome: a project's own copy stays authoritative.
 */
export const DEFAULT_RANK = 600;

/**
 * Skills worth showing outside a Unity project: creating a project, driving the
 * editor from the CLI, and managing packages are all meaningful before a project
 * exists.
 */
export const DEFAULT_WORKSPACE_SKILLS: readonly string[] = [
  'new-unity-project',
  'unity-cli',
  'unity-package-management',
];

/** The schema DSH validates a `unity-skills` row against. */
export const Config = Schema.object({
  providerName: Schema.string()
    .default(DEFAULT_PROVIDER_NAME)
    .description('Provider name registered on the DSH skill registry. Must not be the reserved name "runtime".'),
  rank: Schema.number()
    .default(DEFAULT_RANK)
    .description(
      'Ordering value inside this provider’s scope layer. Layers decide duplicate names first; rank only orders one layer.',
    ),
  skillDir: Schema.string().description(
    'Skill directory. Defaults to the packaged skills/; a relative path resolves against this package root.',
  ),
  exclude: Schema.array(Schema.string())
    .default([])
    .description('Skill folder names to leave out of the catalog entirely.'),
  workspaceSkills: Schema.array(Schema.string())
    .default([...DEFAULT_WORKSPACE_SKILLS])
    .description(
      'Skills that stay model-visible outside a Unity project. Every other skill is still loadable by its explicit name.',
    ),
  gateByProject: Schema.boolean()
    .default(true)
    .description('Hide skills that do not apply to the session’s Unity project.'),
  enforceRequirements: Schema.boolean()
    .default(true)
    .description('Enforce required_editor_version and required_packages from skill frontmatter.'),
  injectContext: Schema.boolean()
    .default(true)
    .description('Contribute the detected project facts as the unity:project runtime context.'),
  watchSkills: Schema.boolean()
    .default(true)
    .description('Refresh the catalog when SKILL.md files under skillDir change.'),
  respectProjectRoots: Schema.boolean()
    .default(true)
    .description('Leave a skill name to the project’s own .dsh/skills or .agents/skills copy when one exists.'),
  statusCommand: Schema.boolean().default(true).description('Register the human-facing /unity-status command.'),
});
