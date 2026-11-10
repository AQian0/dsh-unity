---
name: unity-pipeline
description: Control a Unity Editor or Player via the unity-pipeline package. Compile, run tests, eval, method-reload code, enter Play Mode, capture screenshots.
---

# Unity Pipeline (agent control)

Invoke commands with `unity command <group> <name> [args]`. `unity command` lists the command
groups, `unity command <group>` one group's commands, and `--query <term>` filters by name,
description or tag. Two servers exist: **Editor** (`7800-7849`, auto-starts with the editor) and
**Runtime** (`7900-7949`, only in a dev Player build).

## 1. Install & verify

```bash
unity pipeline install            # install into current project (or --project-path)
unity pipeline list               # confirm the editor instance + server are reachable
unity status --until-ready        # wait until the editor server is ready
unity command editor status       # confirm the editor server answers
```

An Editor that was already open picks up the package only on its next refresh, usually when its
window regains focus. Until then `unity status` reports `STATUS_PIPELINE_LOAD_PENDING`; if that
persists, ask the user to switch to the Unity Editor window, then re-run `unity status --until-ready`.

## 2. Autonomous edit loop (Editor)

This is the core agent workflow: keep the editor alive, change code, recompile, test.

```bash
# 1. Keep the editor ticking even when unfocused/minimized. REQUIRED before headless work —
#    Unity otherwise throttles or stalls update/compile when it isn't the active app.
unity command editor set_auto_tick --enabled true

# 2. Edit C# source files on disk normally.

# 3. Recompile (async: triggers a domain reload, then poll until done).
unity command script recompile
unity command script recompile_status    # repeat until "completed" or "up_to_date"
#   Tolerate connection errors while the domain reload is in flight — that is expected.
#   If script recompile_status reports failed=true, read its "errors" array and fix before testing.

# 4. (Optional) List available tests without running them.
unity command test list --mode editor            # mode: all | editor | playmode

# 5. Run tests (filter to keep it fast).
unity command test run --mode editor --filter MyFixture.MyTest
```

`filter-type`: `testName` | `assembly` | `category`. For long runs use `--async-tests true` and
poll `unity command test status` (abort with `test cancel`). When a selected test *fails*, `test run`
may return an opaque result: re-run a narrower `--filter`, or inspect the Test Runner / logs.

**Reading exit codes.** They separate "rewrite the invocation" from "the Editor failed", which
is the distinction this loop depends on:

| Exit | Meaning | What to do |
|------|---------|------------|
| `2` | Bad arguments — a misspelled flag, a wrong type, too many positionals. Nothing ran. | Fix the command line and retry. The error names the problem and often suggests the right flag. |
| `6` | The command ran and failed, or no Editor could be reached. | Read the error. If it says no Pipeline instance was found, the Editor isn't reachable: wait with `unity status --until-ready` (or check `unity pipeline list` for Safe Mode), then retry. Otherwise retrying the same invocation will not help. |

Do not retry an exit 2 unchanged, and do not rewrite a command line on an exit 6.

## 3. Runtime method reload

Change a running game's method bodies without a domain reload (Mono, Editor Play Mode or a dev
Player). Tagging, `[MethodReload]` constraints, `script.methodreload reload/status/cleanup`,
`--pdb` and `--assembly-dir` are in [methodreload.md](references/methodreload.md).

## 4. Bulk construction: `script run` (the builder pattern)

For bulk work, put the code in a **versioned project script outside `Assets/`** and run a named
static entry point with `script run`; iterating costs an in-memory compile instead of a full
domain reload. Never ship multi-line escaped C# through `script eval`. The file layout, `--file` /
`--entry` / `--args` / `--dry-run`, defines, async entry points, timeouts and `--mode hotpatch` are
in [bulk-construction.md](references/bulk-construction.md).

## 5. C# eval (Editor or dev Player)

`script eval` syntax (inline, `--file`, `--runtime`, `--auto-import`, `--internals`) plus `Wait.*` and its error codes: [csharp-eval.md](references/csharp-eval.md).

## 6. Play Mode vs. Multiplayer Play Mode (MPPM) scenarios

Single-player Play Mode, MPPM Play Mode Scenarios with virtual-player clones, and Multiplayer Roles. Read before entering Play Mode in a multiplayer project: [multiplayer-play-mode.md](references/multiplayer-play-mode.md).

## 7. Screen capture (Editor)

The capture commands, their options, output paths and the "is the frame actually advancing?"
caveat are in [screen-capture.md](references/screen-capture.md).

## Gotchas

The recurring failure modes (stale domain, wrong `--project-path`, timeouts, detached tasks,
hotpatch limits) are collected in [gotchas.md](references/gotchas.md). Check it before debugging a
result that looks impossible.

## Final checks

1. Check that the project has zero console errors:
   ```bash
   unity command console status              # groundTruth.consoleErrors must be 0, compilationFailed false
   unity command console get --level error   # read any errors it reports
   ```
2. If you changed runtime behaviour, enter Play Mode (`unity command editor.playmode start`), exercise
   the change, and read back the `Debug.Log` lines you added with `unity command console get`. Confirm
   they show the fix works, then stop Play Mode and remove those lines unless the user wants them kept.
3. If the fix doesn't work, go back and reread the relevant [Topic map](#topic-map) pages before you
   try again, rather than retrying from memory.

## Final report

The report checklist (what changed, how it was verified, what still needs the user) is in
[final-report.md](references/final-report.md). Keep the answer short and name anything unverified.

## Topic map

The docs map, version substitution and the per-topic links are in
[topic-map.md](references/topic-map.md). Read the page for the command you are about to use.
