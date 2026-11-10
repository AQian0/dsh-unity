# dsh-unity

Unity's 34 curated game-development skills as a DeepSeek Harness (DSH) bundle. Each
session sees the skills its Unity project supports: three starter skills outside a
project, then editor-version and package requirements applied inside one, with the
detected facts added to the runtime context. The full maintainer documentation is in
[README.md](README.md) (Chinese).

## Install

Requirements: a DSH profile, Node.js 22.18+ (24 LTS recommended), pnpm 12.16.1, and a
checkout prepared with `pnpm install && pnpm run build` (the published package ships the
built `lib/`).

- **Web GUI**: open **Plugins**, install with this checkout's absolute path as the spec.
- **Agent**: `plugin_manager` with `action: install_bundle` and `target: /path/to/dsh-unity`.

A published/registry install copies the package into the profile; edits to the checkout do
not apply until you reinstall or upgrade. A source Web or development Desktop install uses
a `link:` and reads the checkout directly. Restart DSH after changing `src/`.

## What it does

- Registers a skill provider per agent through `agent.ctx`, so the catalog lives in that
  session's scope layer and can vary by project.
- Detects the Unity project from `ProjectSettings/ProjectVersion.txt`, reads
  `Packages/manifest.json`, the editor lock, and the `unity` CLI.
- Hides skills whose `required_editor_version` / `required_packages` are unmet from the
  model catalog; `/skill-name` still loads them. Unknown facts never hide a skill.
- Contributes `unity:project` runtime context and a read-only `/unity-status` command.
- Refreshes the catalog when project facts move (a three-file fingerprint check before
  each step) and when `SKILL.md` files change (watcher plus DSH's `fs/observed`).

## Configuration

Override the `unity-skills` row in the profile's `cordis.patch.yml`; the exported
`Config` schema is the source for every field and is editable on the Plugins page.

```yaml
- id: unity-skills
  name: '@aqian0/dsh-unity'
  config:
    workspaceSkills: [unity-cli]
    exclude: [unity-pipeline]
    statusCommand: false
```

See [docs/frontmatter.md](docs/frontmatter.md) for how skill fields map to DSH and
[docs/compatibility.md](docs/compatibility.md) for the supported DSH, Node, and Unity
versions.

## Development

```bash
pnpm install
pnpm test                 # vp check → tsc → node --test
pnpm run validate         # skill structure, YAML, requirements, body budget
pnpm run upstream:check   # upstream drift (network)
pnpm run build            # src/ → lib/
```

`skills/` is a condensed adaptation of
[Unity-Technologies/unity-agent-plugin](https://github.com/Unity-Technologies/unity-agent-plugin);
`upstream.lock.json` pins the upstream commit and file hashes, and a weekly workflow
reports drift for a human to port. A `SKILL.md` body must stay below DSH's 8192-character
tool-result prune line; this package targets 7000 and keeps details in `references/`.

## Known limits

- Skills change the project directly and may run C# in an open Editor; keep the project
  under version control.
- The default `workspace-write` sandbox can deny editor installs, licenses, `~/.unity`,
  and other writes outside the workspace. The skills report the denial and ask for
  approval instead of working around it.
- Hiding a skill only affects the model catalog; explicit `/skill-name` invocation still
  works.
- Installing/enabling affects every session in the profile; replacing the installed
  package needs a DSH restart.

## License

Plugin code is MIT. The content under `skills/` belongs to Unity Technologies and is used
under the Unity Companion License. The icon is ISC (Lucide). See `NOTICE.md` for the
per-path list.
