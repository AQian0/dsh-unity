# Unity CLI command groups

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

