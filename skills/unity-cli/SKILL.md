---
name: unity-cli
description: Controls Unity Editors and projects from the command line, including a running Editor. Use to install or manage Editors, licenses, or projects, set up version control, build, test, edit scenes, run C#, or run any unity command.
allowed-tools:
  - Bash
---

# Unity CLI

**Always use the latest version of the Unity CLI unless you are told to use a
specific version.** Newer releases regularly add commands and output fields
these docs describe, so an outdated CLI fails in ways that read like the docs
being wrong. Check with `unity self-update --check --format json`.

**When you can run shell commands, use `unity command` and the rest of this CLI, not the Unity MCP server.** The CLI reaches more than the server's tools. MCP is for clients that have no shell.

## Find a command: search, don't grep help

**Never filter `unity --help` or a group's help with `grep`.** Help is long, and a grep over it drops the match or the context around it. Use the CLI's own search:

```bash
unity commands --grep license                 # built-in commands, plugins and the connected Editor's Pipeline commands
unity command --query screenshot              # the same search
```

`unity commands --grep <pattern>` and `unity command --query <term>` are one search. It covers the CLI's built-in commands, the plugin catalog (installed or not) and the Pipeline commands of the live connected Editor, best match first. Plain words each match in any order; regex characters make it a regular expression. Each row says how to run it (`invoke`): `unity projects link cloud`, `unity command create_gameobject`, `unity <id>` for an installed plugin, or `unity plugin install <id>` for one not yet installed. In `--format json` each row also carries `kind` (`command`, `plugin`, `pipeline`), `path`, `description` and `matchedOn` (`name`, `description` or `option`), so act on `invoke` rather than parsing the table.

- **Search before you work around the CLI or tell the user it can't help.** A request that names a Unity service, store or product feature (finding Asset Store assets, generating a texture, a cloud build) may be served by a catalog plugin that isn't installed yet, and nothing else on the machine will say so. Search with the request's own words (`unity commands --grep "asset store"`). A row whose `invoke` is `unity plugin install <id>` is that plugin: tell the user, and ask before installing it ([Use a catalog plugin](#use-a-catalog-plugin-for-a-task-the-built-in-commands-dont-cover)).
- Use `unity command --query <term>` to search a specific Editor (`--project-path <project>`) or a Player (`--runtime <pattern>`, e.g. `unity command --query screenshot --runtime MyGame`).
- `commands --grep` waits at most 3 seconds for the Editor; `command --query` waits for it. When the Editor was not searched, a last line says why (no Editor, no answer in time, several Editors) and what to run. Wait for the Editor first with `unity status --until-ready --project-path <project>`: before it connects, no Pipeline row is not proof nothing exists.

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

The full per-command reference — syntax, flags, and examples — lives in grouped files under
[`references/`](references/). **Read the file for the command group you need**; all the global
flags, environment variables, and exit codes above apply throughout. Every command also supports
`-h` / `--help` (see [Getting help](#getting-help)).

| Commands | Reference file |
|---|---|
| `auth` (login / logout / status / list / switch / default / consumers / revoke), `license` (activate / return / server), `cloud` (org / project) | [auth-license-cloud.md](references/auth-license-cloud.md) |
| `pipeline cloud-build` (targets incl. groups, create, update, auditlog / builds incl. steps, timeline, failures, artifacts, log, download, start, cancel / credentials upload / connections / scm check-url / org free-tier / project / tooling), `pipeline automation` (apps / pipelines incl. trigger / jobs incl. watch, logs, terminate, resume, approve, reject / automations / bots / profiles / templates, plus `apps versions`, `pipelines versions`, `jobs stats`) | [cloud-automation.md](references/cloud-automation.md) |
| `editors` (list / running / add / default / path / install-path / info / upgrade / prune / verify / module), `install`, `uninstall`, `modules`, `install-modules`, `terms` (accept / status) | [editors-install.md](references/editors-install.md) |
| `projects` (list / create / clone / open / link / require / upgrade / export / import / pin / size / clean / exec; its help reads "Create, open, upgrade, and link local Unity projects (Unity Cloud, GitHub/GitLab)", so linking a folder to Unity Cloud is `projects link cloud`, not `cloud`), `open`, `close`, `releases`, `templates` (list / info / create / pack / delete), `assets` (`inspect` / `export`) | [projects-templates.md](references/projects-templates.md) |
| `config` (proxy / update-check / accelerator / get / set / list / unset / resolve), `context` (save / use / list / current / delete), `hub install` | [config-hub.md](references/config-hub.md) |
| `run`, `test`, `build` (+ `build run`), `recompile`, `watch` (`test`) | [build-run-test.md](references/build-run-test.md) |
| `logs`, `doctor`, `env`, `version`, `cache`, `ci init`, `analytics`, `changelog`, `docs` (+ `toc`), `language`, `completion`, `bug`, `self-update`, `self-uninstall`, `diagnose proxy`, `diagnose accelerator`, `diagnose update` | [diagnostics-maintenance.md](references/diagnostics-maintenance.md). To find, cite and version-match Unity docs: [docs-workflow.md](references/docs-workflow.md) |
| `mcp` (+ `configure`), `setup claude` / `codex` / `grok` / `antigravity` / `copilot` / `qwen` / `vscode` / `opencode`, `skill` (install / refresh / show), `plugin` (install / remove / upgrade / list / changelog), local `pipeline` (install / upgrade / list / list-versions), `command` / `commands` / `status` / `list`, `job` (status / wait / cancel), answering an open modal dialog (`command editor dialog` / `editor dialog answer`, or `editor.dialog list` / `answer` / `dismiss`), `shell` | [integration-advanced.md](references/integration-advanced.md) |
| `vcs` — `setup` / `status` / `sync` / `switch` / `doctor` / `providers` / `merge-setup` / `conflicts` / `explain` / `resolve` / `diff` / `blame` / `summarize` / `affected` / `hooks`, `vcs git` (`migrate-lfs` / `worktree`), `vcs uvcs` (`locks` / `changesets` / `review`) | [version-control.md](references/version-control.md) |
| `collaboration` (alias `collab`) — `annotations` / `attachments` / `thumbnail` / `reactions` / `read` / `subscribe` / `jira` | [collaboration.md](references/collaboration.md) |

## Common workflows

### Inspect and run cloud builds and Pipeline Automation jobs

`pipeline cloud-build` and `pipeline automation` end to end: [cloud-workflows.md](references/cloud-workflows.md).

### Edit a scene, GameObject, or asset — `unity status` first

Read before editing any scene, prefab or asset: the preflight and the Safe Mode / sandbox false negatives in [scene-editing-preflight.md](references/scene-editing-preflight.md).

### Use a catalog plugin for a task the built-in commands don't cover

When a request names a Unity feature no built-in command covers, check the catalog first: [catalog-plugins.md](references/catalog-plugins.md).

### Bootstrap a new project from scratch

Raw CLI recipe from install to first commit (the `new-unity-project` skill is the guided path): [bootstrap-project.md](references/bootstrap-project.md).

### Find and install a missing editor

Check what is installed, browse LTS releases, then install one: [setup-and-help.md](references/setup-and-help.md#find-and-install-a-missing-editor).

### Open a project with the correct editor

```bash
# 1. Check the project's required editor version
unity projects info /path/to/MyProject --format json
# Look at "editorVersion" in the result

# 2. Confirm that editor is installed
unity editors --installed --format json

# 3. Open (warns if the editor version is missing)
unity open /path/to/MyProject
```

### CI: activate a license, then build

CI recipe that activates a license, builds, then returns it: [ci-recipes.md](references/ci-recipes.md#ci-activate-a-license-then-build).

### CI: headless build

Headless `unity build` and `unity run` invocations for CI: [ci-recipes.md](references/ci-recipes.md#ci-headless-build).

### CI: run tests and publish results

JUnit output, exit-code branching and test-selection rules: [ci-recipes.md](references/ci-recipes.md#ci-run-tests-and-publish-results).

### Debug the CLI

`unity doctor --json` and `unity logs --follow` while a run misbehaves: [setup-and-help.md](references/setup-and-help.md#debug-the-cli).

## Notifications

When a JSON envelope carries `notifications`: what to surface and what needs approval — [notifications.md](references/notifications.md).

## Notes

Parsing, output-shape and quoting rules to know before trusting a result: [notes.md](references/notes.md).

