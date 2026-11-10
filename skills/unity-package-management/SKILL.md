---
name: unity-package-management
description: Adds, removes, upgrades, and finds Unity (UPM) packages from outside the Editor. Use for package installs, checking package IDs and versions, or choosing which packages a game needs.
allowed-tools:
  - bash
  - write
  - edit
---

# Unity Package Management (Pipeline commands first, C# script as the fallback)

Add, remove, upgrade, and discover UPM (Unity Package Manager) packages with the `package`
commands of the project's Pipeline package, run through `unity command`. Only when no Editor can
answer those commands, fall back to `UnityEditor.PackageManager.Client` driven headless from a
script (see [Fallback](#fallback-no-editor-to-ask-the-c-client-api)). Do **not** hand-edit
`Packages/manifest.json`: the Package Manager resolves dependencies and compatible versions
correctly, whereas manual edits routinely break resolution.

Complements the **`unity-cli`** skill, which documents `unity command`, `unity status` and
`unity pipeline install`.

## Use the package commands first

The Pipeline package registers a `package` command group: `add`, `remove`, `list`, `resolve`,
`search` and `status`. They need a running Editor whose project has `com.unity.pipeline` (add it
with `unity pipeline install`, then `unity open`, then wait with `unity status --until-ready`).
Each command's parameters come from the Editor, so read them before the first call. Don't guess
a parameter name.

```bash
unity status --until-ready --project-path "<project-path>"
unity command package --project-path "<project-path>"                  # the package commands this Editor has
unity command --query package --format json --project-path "<project-path>"   # each command's parameter schema
unity command package search --project-path "<project-path>"           # then pass the parameters the schema lists
unity command package add --project-path "<project-path>"              # add one or more packages by id
unity command package list --project-path "<project-path>"             # confirm what is installed
```

Pass a command's parameters after its name, as the schema names them (`unity command <group>
<command> --<parameter> <value>`). Add every package you need in one `package add` call when the
schema accepts several ids. Pin a version the way the schema describes when a minimum is required
(the `@<version>` id form belongs to the C# fallback below). Use `package status` or `package list` to verify, and
`package remove` to drop a package. Treat a non-zero exit as a failure and read its message.

If `unity command package` reports no such group, the project's Pipeline package predates it:
run `unity pipeline upgrade`, or use the fallback below. The fallback starts its own Editor, so it
can't run while this one has the project open: ask the user to save and close it first.

## When to use, and what to install

- Add / remove / upgrade packages in an existing or freshly-created project, or set them
  non-interactively in CI (the fallback script, when no Editor is running).
- Verify a package id exists, or find its available versions, before depending on it.
- Decide which packages a game actually needs (see below).

Install what the project actually needs, not everything; prefer packages the chosen template
already provides (URP templates already include the render pipeline, Input System, etc.). The
genre / look / platform / monetization → package mapping, plus how to search the registry, is
in [references/select-packages.md](references/select-packages.md). Produce a **deduplicated
list of package ids** and read it back to the user before installing.

## Fallback: no Editor to ask (the C# Client API)

Use this only when `package add` can't run: no Editor is open and you don't want one open, the
project has no Pipeline package, or the command group is missing and an upgrade isn't wanted. It
installs through `Client.AddAndRemove` from a script the Editor runs in batch mode.

**The project must be closed first.** The script runs in a second, batch-mode Editor, and an Editor
that already has the project open holds its lock, so the batch run fails before the script starts.
Check it first — [references/headless-run.md](references/headless-run.md) has the commands — then
ask the user to save their work and close the Editor, and wait until they say it is closed.

- **Never close or kill the user's Editor yourself:** it may hold unsaved scenes or a Play Mode
  session.
- **Never retry a lock failure and never remove `<project-path>/Temp/UnityLockfile`:** treat the
  project as open and ask the user to close it.
- **If you can't tell whether it is open, or the user wants to keep it open, don't run the
  fallback:** say the install waits until the project is closed or the Pipeline package is
  upgraded (`unity pipeline upgrade`, then `package add`).

The C# installer that edits `Packages/manifest.json` and runs headless is
[references/installer-script.md](references/installer-script.md); how to list, verify and inspect
installed packages is [references/discovering-packages.md](references/discovering-packages.md).

## Never `unity run` the installer

**Never use `unity run` for the installer, and never pass `-quit`.** `Client.Add` /
`Client.AddAndRemove` are **asynchronous**: the request only completes on later
`EditorApplication.update` ticks, so the Editor must **stay alive** after `-executeMethod` returns.
`unity run` injects `-quit`, which quits the Editor before UPM resolves, so packages never install
and the callback never runs. Launch the **Editor binary** in `-batchmode` **without** `-quit`
instead, letting the script call `EditorApplication.Exit(code)` — why, the reserved flags, and the
exact per-OS invocation: [references/headless-run.md](references/headless-run.md).

## Verify

```bash
# Every requested id should appear as a dependency
cat "<project-path>/Packages/manifest.json"
```

Confirm the run exited `0` and every requested id is present in `manifest.json`. A package that
fails to resolve logs `_request.Error.message` — read it and check the id/version against the
registry. The `[PackageInstaller]` lines are in the Editor log you streamed with `-logFile -`;
read errors there, not from `unity logs`.

## Import & save headlessly (generate `.meta` files)

After a script or tool writes new `.cs`/asset files, Unity must **import** them so it generates the
`.meta` each asset needs — and every `.cs`/asset MUST be committed with its `.meta`.
`unity open "<project-path>"` does it once; for CI, the synchronous `ProjectSaver` script and its
`unity run` invocation: [references/import-save-headless.md](references/import-save-headless.md).

## Notes

- These editor scripts are a bootstrap convenience. Leave them in
  `Assets/Editor/ProjectBootstrap/` or delete them after setup — your call; mention it to the user.
  They live under `Editor/` because they use `UnityEditor`, so they never ship in a build.
- Monetization / backend packages (`com.unity.purchasing`, `com.unity.services.levelplay`, the UGS
  packages) install the same way, but the actual **integration** belongs to the dedicated skills:
  **implement-in-app-purchases**, **levelplay-unity-integration**, **build-live-game**.
