# Global flags

These work on every command:

| Flag | Description |
|---|---|
| `--format <fmt>` | Output format: `human` (default), `json`, `tsv`, `ndjson`, `github`. Also via `UNITY_FORMAT` env var. |
| `--json` | Global shorthand for `--format json`, accepted on every command (e.g. `unity status --json`, `unity doctor --json`). Passing it with a different `--format` (e.g. `--json --format tsv`) is a usage error (exit 2); `--json` overrides `UNITY_FORMAT`. |
| `--no-banner` | Suppress the branded header — use in scripts |
| `--no-header` | Leave the header row out of `tsv` tables. The header row is the column names, which are the same keys the `json` rows use (`version`, `upgradeTo`, ...). An empty `tsv` result is the header row alone, so with `--no-header` it is no output at all. |
| `--no-pager` | Turn off paging. Governs both pagers: the external one over the long listings (`unity command`, `releases`, `editors`, `changelog`, `logs`) and the interactive one in `unity projects`. Also via `UNITY_NO_PAGER` (presence-based — any value, including `0`, disables it). |
| `--non-interactive` | Disable all interactive prompts — use in CI |
| `--quiet` | Hide notices, warnings and progress in human and tsv output. Errors, the exit code and the `tsv` rows stay, so a script that pipes with `--quiet` still gets its data. json output never changes, and ndjson output does not either, except that a few listings still drop their rows (see [Notes](../SKILL.md#notes)). |
| `--verbose` | Print full error details (stack trace + cause chain) on failure. Also via `UNITY_VERBOSE`. |
| `--proxy <url>` | HTTP/HTTPS/SOCKS/PAC proxy URL for this invocation. Also via `UNITY_PROXY`. Takes precedence over standard `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` env vars and the persisted `proxy.json` setting. |
| `--proxy-disable` | Disable proxy for this invocation, ignoring all sources (env vars, persisted config, system settings). |
| `--log-proxy` | Log one redacted entry per outbound request to `proxy-request.json` — for reproducing proxy issues. Also via `UNITY_LOG_PROXY=1` or the `proxyRequestLogging` setting. |
| `--no-log-proxy` | Opt a single invocation out of proxy request logging when it's enabled globally. |
| `--color <auto\|always\|never>` | Control colored output for this invocation, overriding `NO_COLOR`/`FORCE_COLOR` and TTY auto-detection. Governs every ANSI-emitting surface (help, tables, spinners, errors), not just `human` output. |
| `--no-color` | Shorthand for `--color never`. Whichever of `--color`/`--no-color` appears last on the line wins. |

**Always use `--format json` when you need to parse output programmatically.** If you read `tsv` instead, select columns by header name, not position: a command's `tsv` columns keep their names and order, and a flag that adds information (such as `editors --long`) only appends columns at the end. Failures in `tsv` go to stderr, so stdout holds only data. A single-record answer (`unity env`, `unity config proxy`, `unity doctor`, `unity editors default`, `unity install-path` and the like) is a `key<TAB>value` table instead, one row per field keyed by its `json` path (`values.editor`, `tools.0.id`), so `unity install-path` piped prints the path on its `path` row, not bare; `unity cache key` alone still prints the bare key.

**Every listing has one JSON shape.** Read the rows from `.data.items[]`. Beside them, `.data.total` is the full count (`null` when the service doesn't report one), `.data.nextPage` (pass it to the command's `--page`, `--skip` or `--offset`, whichever it takes: `--offset` for `collab annotations count --grouped`) or `.data.nextCursor` (pass it to `--next` or `--cursor`) is `null` on the last page, and `.data.partial` is `true` when the listing stopped before it finished. Under `--format ndjson` the rows stream one per line and the last line, `type: "result"`, carries `count` and the same paging fields. Some listings still carry their older keys too (`instances`, `entries`, `results`); prefer `items`.

`--accelerator <host:port>` and `--no-accelerator` are **not** root globals — they are accepted only on `run`, `test` and `build`, and only after the command name. See [build-run-test.md](build-run-test.md).

**`unity projects` is the only command that pages IN-PROCESS.** It shows 10 projects per screen and waits for a keypress between screens, and only when stdout is a terminal. Paging is off for redirected stdout, under every machine format (`json`, `ndjson`, `tsv`, `github`), and under `--all`, `--watch`, or `--no-pager` / `UNITY_NO_PAGER`.

**The long listings page through an external pager, like `git log`.** `unity command` (the bare listing), `unity releases`, `unity editors`, `unity changelog`, and `unity logs` pipe human output through `less -RFX` on a terminal; `-F` quits by itself when the output fits one screen. `$UNITY_PAGER` then `$PAGER` override the choice and run through a shell, so `PAGER="less -S"` works; a blank value is ignored rather than treated as an opt-out. Like `projects`'s pager this one is **`human`-only**, and it never engages for redirected stdout, any machine format (`json`, `tsv`, `ndjson`, `github`), `--quiet`, `TERM=dumb`, the streaming modes (`editors --watch`, `logs --follow`), a named `unity command <name>`, or inside `unity shell`. A broken pager costs the paging, not the output: a `$PAGER` naming something that is not there is resolved before anything spawns (a warning on stderr names it, and on Windows a bare name also finds `.com` programs such as `more`), and one that spawns and then dies has its output reprinted to the terminal, decided from the pager's exit status (a clean exit is a normal `q` and discards; a failure status reprints). A pager that exits 0 without reading (`PAGER=true`) is indistinguishable from `q`, so its output is lost. One that merely *waits* is not broken; the CLI waits with it.

A branded Unity header (logo, wordmark, CLI version) renders on the landing surfaces — bare `unity`, `unity --help` / `-h`, and `unity help`. It's shown only on a TTY, prints at most once, and degrades to compact, uncolored text on narrow terminals, without Unicode, or under `NO_COLOR`. Piped output is unaffected. Use `--no-banner` to suppress it in scripts. Bare `unity` prints usage and exits 0.
