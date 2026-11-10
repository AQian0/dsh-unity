# Unity skills

Brings Unity's 34 official game-development skills into DeepSeek Harness. The catalog
follows the Unity project a session is working in, the detected facts go into the runtime
context, and edits under `skills/` take effect without a restart.

## What the bundle provides

- **34 skill folders** covering UI and editor tooling, 2D/physics/scenes, audio and
  performance, rendering and shaders, multiplayer/voice/monetization, project and package
  management, and builds. A `SKILL.md` body routes; details live in its `references/` and
  are read on demand.
- **Per-agent registration**: every session gets its own catalog in its own scope layer,
  so a preset copy cannot shadow it, and the catalog can vary with that session's project.
- **Project gating**: walks up to `ProjectSettings/ProjectVersion.txt`, reads the editor
  version, `Packages/manifest.json`, the editor lock, and the `unity` CLI. A skill whose
  `required_editor_version` or `required_packages` is unmet leaves the model catalog but
  stays loadable by its explicit `/skill-name`. Unknown facts never hide a skill.
- **`unity:project` context**: project path, editor version, render pipeline,
  editor/CLI state, and the hidden skills with their reasons.
- **`/unity-status`**: the same facts for a person, read-only, with no subprocess.
- **Live refresh**: a three-file fingerprint check before each step, plus the watcher and
  DSH's `fs/observed` for `skills/`, so no restart is needed.

## When it applies

Inside a Unity project, the model routes requests such as "build a settings screen",
"add in-app purchases with rewarded ads", or "pixel art looks blurry when the camera
moves" to the matching skill. Outside a project only the three starter skills remain
(`new-unity-project`, `unity-cli`, `unity-package-management`).

## Configuration

Override the `unity-skills` row in the profile's `cordis.patch.yml`:

```yaml
- id: unity-skills
  name: '@aqian0/dsh-unity'
  config:
    workspaceSkills: [unity-cli]
    exclude: [unity-pipeline]
    statusCommand: false
```

The exported `Config` schema (editable on the Plugins page) is the source for every field;
`docs/frontmatter.md` explains how skill fields map to DSH.

## Known limits

- Skills change the project directly (scripts, scenes, assets), and run C# in an open
  Editor when the Unity CLI is available. Keep the project under version control.
- The default `workspace-write` sandbox may deny editor installs, licenses, `~/.unity`,
  and other writes outside the workspace; the skills report the denial and ask for approval
  instead of working around it.
- Hiding a skill only removes it from the model catalog; `/skill-name` still loads it.
- A skill body must stay below DSH's 8192-character prune line; this package targets 7000
  and keeps details in `references/`.
- The local skills are a condensed adaptation of upstream; a weekly workflow reports
  upstream drift for a human to port.

License: plugin code MIT; `skills/` content under the Unity Companion License; icon ISC.
See `NOTICE.md` in the package.
