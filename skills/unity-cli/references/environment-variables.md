# Environment variables

All CLI env vars use the `UNITY_` prefix. A CLI flag always overrides the corresponding env var.

| Variable | Mirrors flag | Description |
|---|---|---|
| `UNITY_FORMAT` | `--format` | Output format (`human`, `json`, `tsv`, `ndjson`, `github`). `HUB_FORMAT` is a deprecated alias. |
| `UNITY_EDITOR_VERSION` | `--editor-version` | Editor version (e.g. `2023.3.0f1`, `latest`, `lts`). Read by every command that takes `--editor-version`, `build` included; `build` prints a notice when the variable chose its Editor. Not read by the `pipeline cloud-build` filters. |
| `UNITY_ARCHITECTURE` | `--architecture` | Chip architecture (`x86_64`, `arm64`). `build` names it in the same notice. |
| `UNITY_PROJECT_PATH` | `--project-path` | Project path when none is passed. Read by every command that takes `--project-path` (the Editor-connecting commands, `recompile`, `pipeline`, `collaboration`, `assets`, `auth default`, `templates create`/`pack`, `projects link`, `projects unlink vcs` and the `vcs` commands that act on a project) and by `open`. A path argument or `--project-path` wins over it. Not read by `close` (and `projects close`), `projects unlink cloud`, `mcp configure` or `ci init`. |
| `UNITY_QUIET` | `--quiet` | Suppress non-essential output. |
| `UNITY_VERBOSE` | `--verbose` | Show full error details on failure. |
| `UNITY_NON_INTERACTIVE` | `--non-interactive` | Disable interactive prompts. |
| `UNITY_NO_BANNER` | `--no-banner` | Suppress the branded banner. |
| `UNITY_NO_PAGER` | `--no-pager` | Turn off paging — both the external pager over the long listings and `unity projects`'s interactive one. Presence-based: any value counts, including `0`. |
| `UNITY_PAGER` | — | The pager to use for the long listings, overriding `$PAGER` and the `less -RFX` default. Runs through a shell, so flags work (`less -S`). A blank value is ignored, not an opt-out. |
| `PAGER` | — | Same as `UNITY_PAGER`, consulted only when that is unset or blank. |
| `LESS` / `LV` / `LESSCHARSET` / `MORE` | — | Passed to the pager only when you have not set them, defaulting to `FRX`, `-c`, `utf-8`, and `FRX`. `LESSCHARSET` keeps multi-byte glyphs readable where the locale does not declare UTF-8; `MORE` exists because `more` on macOS/BSD is `less` under another name and reads `$MORE`, so without it `PAGER=more` waits for a keypress even for one line. |
| `UNITY_RUN_TIMEOUT` | `--timeout` | Timeout for `unity run` in seconds. |
| `UNITY_TEST_TIMEOUT` | `--timeout` | Timeout for `unity test` in seconds. |
| `UNITY_CLOUD_ORG` | `--cloud-org` | Active Unity Cloud organization id or name for a single call. |
| `UNITY_CLOUD_PROJECT` | `--cloud-project` | Cloud project ID or name (a service account needs the ID); used by Cloud Build inventory. Pipeline Automation inventory is organization-scoped. |
| `UNITY_NO_CLOUD` | `--no-cloud` | Decline the Unity Cloud link on `projects create` and `projects upgrade`. Presence-based: any value counts, including `0`. On `projects create` and `projects upgrade`, an explicit `--cloud`, `--cloud-project`, `--cloud-org` or `--coppa` wins over it. `projects create --vcs uvcs` is refused with it set unless one of those flags overrides it. |
| `UNITY_SERVICE_ACCOUNT_ID` | — | Service account client ID for non-interactive (CI) auth. |
| `UNITY_SERVICE_ACCOUNT_SECRET` | — | Service account client secret for non-interactive (CI) auth. |
| `UNITY_PROXY` | `--proxy` | HTTP/HTTPS/SOCKS/PAC proxy URL. Takes precedence over `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` and the persisted `proxy.json` setting. |
| `UNITY_NO_UPDATE_CHECK` | — | Disable the background "update available" check (see `unity config update-check`). |
| `UNITY_CLI_ROLLBACK_KEEP` | — | How many previous CLI versions `unity self-update` keeps for `--rollback`, from 1 to 10 (default 3). |
| `UNITY_NO_AGENT_HINTS` | — | Stop suggesting Unity's agent plugin or skill when an AI agent runs `unity`: Claude Code's install prompt, the `unity setup codex` / `grok` / `antigravity` / `copilot` tip, and the `unity skill install` tip (an `AGENT_PLUGIN_AVAILABLE` entry in the envelope's `notifications` under `--format json`), plus the once-a-day `unity skill sync` notice when installed Unity skills are older than the CLI's pin (`AGENT_SKILLS_OUTDATED`). Presence-based: any value counts. A tip asks you to get the user's approval before running its command. |
| `UNITY_NO_CRASH_REPORT` | — | Disable anonymous crash/error reporting (Sentry) entirely. The Hub's "Send crash reports" setting, when off, also disables it. |
| `UNITY_NO_CLI_INVOKED_TELEMETRY` | — | Stop the anonymous once-per-run `cli telemetry` usage ping. Presence-based: any value counts. |
| `DO_NOT_TRACK` | — | The cross-tool [Console Do Not Track](https://consoledonottrack.com) setting. Any value but empty, `0` or `false` stops the `cli telemetry` usage ping and the upload of opt-in usage data. Licensing records are not affected. |
| `UNITY_LOG_PROXY` | `--log-proxy` | Log one redacted entry per outbound request to `proxy-request.json`. Truthy values: `1`, `true`. |
| `UNITY_ACCELERATOR` | `--accelerator` | Unity Accelerator endpoint (`host:port`). Outranks the persisted `accelerator.json`; `--accelerator` outranks it. |
| `UNITY_NO_ELEVATE` | `--no-elevate` | Windows: skip the elevated (UAC) install helper for `install` / `install-modules`, so the install service runs unelevated. The Editor's NSIS installer still asks for elevation on demand if Windows requires it for your account — an administrator token always does; a standard user never does. |
| `UNITY_INSTALL_RETRIES` | `--retries` (`install-modules` only) | Number of times `install` and `install-modules` retry an editor or module download whose transfer or validation fails. `0` disables retries; `unity install` has no `--retries` flag, so set the variable there. |
| `UNITY_NO_AUTH_BROKER` | — | Skip the resident auth broker and read credentials directly from the OS keyring. By default every command that needs a token goes through a broker that starts on demand and exits after two idle minutes (see [auth-license-cloud.md](auth-license-cloud.md)). |
| `UNITY_CLI_HOME` | — | Install root for the install script and `unity self-install`, on every platform including Windows: the binary lands in `<UNITY_CLI_HOME>/bin` instead of the default location. |
| `UNITY_NO_EDITOR_IDENTITY_SERVER` | — | Disable the background identity helper that `unity open` starts to answer the Editor’s sign-in lookups when no Hub is running (see [projects-templates.md](projects-templates.md)). Presence-based. |
| `UNITY_EXPERIMENTAL_FEX_EMU` | none | Linux arm64 only, experimental and unsupported: run the x86_64 Editor under FEX-Emu. `1`, `true` or `yes` turns it on, and it takes effect only when FEX-Emu and an x86_64 RootFS are installed (`unity doctor` checks). C# script compilation is known to crash under FEX-Emu. See [editors-install.md](editors-install.md). |

**CI service account auth:** Set both `UNITY_SERVICE_ACCOUNT_ID` and `UNITY_SERVICE_ACCOUNT_SECRET` to skip the browser OAuth flow — this keeps the secret out of the process argument list and shell history. These map to the `--client-id` / `--secret-from-stdin` inputs of `unity auth login`, but reading the credentials from the environment isn't a full login: it doesn't run the interactive flow or persist credentials to the keyring.
