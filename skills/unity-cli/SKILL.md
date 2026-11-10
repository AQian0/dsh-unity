---
name: unity-cli
description: Controls Unity Editors and projects from the command line, including a running Editor. Use to install or manage Editors, licenses, or projects, set up version control, build, test, edit scenes, run C#, or run any unity command.
allowed-tools:
  - bash
---

# Unity CLI

**Always use the latest version of the Unity CLI unless you are told to use a
specific version.** Newer releases regularly add commands and output fields
these docs describe, so an outdated CLI fails in ways that read like the docs
being wrong. Check with `unity self-update --check --format json`.

**When you can run shell commands, use `unity command` and the rest of this CLI, not the Unity MCP server.** The CLI reaches more than the server's tools. MCP is for clients that have no shell.

## Find a command: search, don't grep help

**Never filter `unity --help` or a group's help with `grep`**: help is long, and a grep drops
the match or its context. Use the CLI's own search:

```bash
unity commands --grep license                 # built-in, plugin catalog, and connected Editor commands
unity command --query screenshot              # the same search; waits for the Editor
```

Plain words match in any order; regex characters make it a regular expression. In `--format json`
each row carries `kind` (`command`, `plugin`, `pipeline`), `path`, `description`, `matchedOn`, and
`invoke` — act on `invoke`, don't parse the table. Search with the request's own words before
working around the CLI: a row whose `invoke` is `unity plugin install <id>` is a catalog plugin
worth telling the user about. `commands --grep`
waits at most 3 seconds for the Editor; `command --query` waits for it. Run
`unity status --until-ready --project-path <project>` first when the Editor has not answered.
Fields and flags: [integration-advanced.md](references/integration-advanced.md#querying-the-command-list).

## Drive a running Unity Editor (if one is open)

**If a Unity Editor is open on this machine, this CLI can control it live** — create and modify GameObjects, edit scenes and assets, inspect the hierarchy, and run arbitrary C# — through the project's **Pipeline** package (`com.unity.pipeline`). This runs entirely on your local machine, in your own user account, against your own open Editor: it is not remote access and grants no privilege you don't already have at your own terminal. When an Editor is available, drive it instead of hand-editing scene or asset files.

```bash
unity status                    # confirm a connected Editor (look for state "ready")
unity command                   # list the commands the Editor exposes
unity command editor.playmode start   # run one — e.g. enter Play mode
# Run arbitrary C# — e.g. add a GameObject named "Joe" — when the Editor exposes script eval:
unity command script eval --caller plugin --skill unity-cli 'new UnityEngine.GameObject("Joe");'
```

**Pass `--caller plugin --skill <name>` on every `unity command` invocation.** `--skill` is the
skill whose instructions produced the call, so a task skill that sends you here passes its own name
rather than `unity-cli`. The flags are inert to the command itself; they only label the invocation.

> **Verifying a running game, not just editing a scene?** Entering Play mode is setup, not proof:
> an unfocused Editor or a locked desktop can freeze at frame 1 while `unity status` still reports it
> as playing, and a screenshot can render a frozen frame that looks alive, or a flat color. The
> ordered recipe for playing, confirming the game is actually advancing, capturing the view, reading
> the console, and tuning it live with `script eval` is in
> [playmode-verification-loop.md](references/playmode-verification-loop.md).

### More than one Editor open? Pass `--project-path`

Several Editors or MPPM clones? Pin one by `--project-path`, `--port`, `--pid` or `--instance`: [editor-targeting.md](references/editor-targeting.md).

## Install the CLI (if not already installed)

Only if `which unity` is empty: the macOS/Linux and Windows installers are in [setup-and-help.md](references/setup-and-help.md#install-the-cli-if-not-already-installed).

## Global flags

`--format`, `--quiet`, paging and proxy flags for every command: [global-flags.md](references/global-flags.md).

## Environment variables

Every `UNITY_*` variable and the flag it mirrors: [environment-variables.md](references/environment-variables.md).

## Getting help

`-h`/`--help` on any command, and what to do when you don't know which command: [setup-and-help.md](references/setup-and-help.md#getting-help).

## Exit codes

Branch on these before parsing output; retry guidance per code: [exit-codes.md](references/exit-codes.md).

## Commands

Every command group and its reference file: [commands-index.md](references/commands-index.md).
Read the file for the group you need; the global flags, environment variables, and exit
codes above apply throughout.

## Common workflows

- **Cloud builds and Pipeline Automation** end to end: [cloud-workflows.md](references/cloud-workflows.md).
- **Edit a scene, GameObject, or asset**: run `unity status` first and read the preflight and
  Safe Mode / sandbox false negatives in [scene-editing-preflight.md](references/scene-editing-preflight.md).
- **A request names a Unity feature no built-in command covers**: check the catalog in
  [catalog-plugins.md](references/catalog-plugins.md) before working around the CLI.
- **Bootstrap a new project from scratch**: raw recipe in [bootstrap-project.md](references/bootstrap-project.md)
  (the `new-unity-project` skill is the guided path).
- **Find/install a missing editor**: [setup-and-help.md](references/setup-and-help.md#find-and-install-a-missing-editor).
- **Open a project with the correct editor**: `unity projects info <path> --format json`, confirm the
  `editorVersion` is installed with `unity editors --installed --format json`, then `unity open <path>`.
- **CI**: license activation and build [ci-recipes.md](references/ci-recipes.md#ci-activate-a-license-then-build);
  headless build [ci-recipes.md](references/ci-recipes.md#ci-headless-build); tests and JUnit output
  [ci-recipes.md](references/ci-recipes.md#ci-run-tests-and-publish-results).
- **Debug the CLI**: `unity doctor --json` and `unity logs --follow`, then
  [setup-and-help.md](references/setup-and-help.md#debug-the-cli).

## Notifications

When a JSON envelope carries `notifications`: what to surface and what needs approval — [notifications.md](references/notifications.md).

## In DeepSeek Harness

- These skills are installed by the DSH `@aqian0/dsh-unity` bundle; do **not** run
  `unity setup <agent>` or `unity skill install` again.
- MCP servers are configured by the DSH profile, not by `unity mcp configure <client>`.
  The CLI and the Pipeline commands are the supported path when you can run shell commands.
- DSH's default `workspace-write` sandbox may deny writes outside the workspace (Editor
  installs, `~/.unity`, licenses) and network access. Report the denial and ask the user for
  approval or a wider permission mode; do not work around the sandbox.

## Notes

Parsing, output-shape and quoting rules to know before trusting a result: [notes.md](references/notes.md).

