---
name: unity-package-management
description: Adds, removes, upgrades, and finds Unity (UPM) packages from outside the Editor. Use for package installs, checking package IDs and versions, or choosing which packages a game needs.
allowed-tools:
  - Bash
  - Write
  - Edit
---

# Unity Package Management (Pipeline commands first, C# script as the fallback)

Add, remove, upgrade, and discover UPM (Unity Package Manager) packages with the `package`
commands of the project's Pipeline package, run through `unity command`. Only when no Editor can
answer those commands, fall back to `UnityEditor.PackageManager.Client` driven headless from a
script (see [Fallback](#fallback-no-editor-to-ask-the-c-client-api)). Do **not** hand-edit
`Packages/manifest.json`: the Package Manager resolves dependencies and compatible versions
correctly, whereas manual edits routinely break resolution.

This complements the **`unity-cli`** skill (editor install, project creation, build/test), which
documents `unity command`, `unity status` and `unity pipeline install`.

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
can't run while this one has the project open: ask the user to save and close it first (see the
fallback's first rule).

## When to use

- Add / remove / upgrade one or more packages in an existing or freshly-created project.
- Set up a project's packages non-interactively in CI (fallback script when no Editor is running).
- Verify a package id exists, or find its available versions, before depending on it.
- Decide which packages a game actually needs — see
  [references/select-packages.md](references/select-packages.md).

## Choosing what to install

Install what the project actually needs, not everything; prefer packages the chosen template
already provides (URP templates already include the render pipeline, Input System, etc.). The
genre / look / platform / monetization → package mapping, plus how to search the registry, is
in [references/select-packages.md](references/select-packages.md). Produce a **deduplicated
list of package ids** and read it back to the user before installing.

## Fallback: no Editor to ask (the C# Client API)

Use this section only when `package add` can't run: no Editor is open and you don't want one
open, the project has no Pipeline package, or the command group is missing and an upgrade isn't
wanted. It installs through `Client.AddAndRemove` from a script the Editor runs in batch mode.

**The project must be closed first.** The script runs in a second, batch-mode Editor, and an Editor
that already has the project open holds its lock, so the batch run fails before the script starts.
`unity editors running --format json` lists every open Editor, with or without the Pipeline package
(`unity status` lists only Pipeline projects, so an empty result there does not mean closed). Compare each
`data.instances[].projectPath` with the target project. Also check whether `<project-path>/Temp/UnityLockfile`
exists, and ask the user whether the project is open in an Editor. If an Editor has the project open, or you can't tell, ask the user to save their work and close it,
and wait until they say it is closed. If the batch run still fails on a lock, treat the project as open and
ask the user to close it; don't retry or remove the lock file. Never close or kill
the user's Editor yourself: it may hold unsaved scenes or a Play Mode session. If the user wants to
keep it open, don't run the fallback: tell them the install waits until the project is closed or the
Pipeline package is upgraded (`unity pipeline upgrade`, then `package add`).

## The `-quit` problem — why NOT `unity run` for installs

`Client.Add` / `Client.AddAndRemove` are **asynchronous**: they return a `Request` that only
completes on later `EditorApplication.update` ticks (the UPM child process marshals its result
back on the Editor's main-loop pump, so a blocking `while (!req.IsCompleted)` busy-wait
deadlocks it). The Editor must **stay alive** after `-executeMethod` returns, until the request
finishes.

`unity run` **cannot** be used for the installer: its default path injects `-quit` (see the reserved
flags in the **`unity-cli`** skill). With `-quit`, the Editor quits the instant the method
returns — before UPM resolves — so packages never install and the callback never runs.

**Solution:** launch the **Editor binary directly** in `-batchmode` **without** `-quit`. The
Editor stays alive, `EditorApplication.update` keeps ticking, the poll callback runs, and it
calls `EditorApplication.Exit(code)` itself when done — which both quits and sets the process
exit code.

## The installer script

The C# installer that edits `Packages/manifest.json` and runs headless: [references/installer-script.md](references/installer-script.md).
## Discovering / verifying packages

How to list, verify, and inspect installed packages: [references/discovering-packages.md](references/discovering-packages.md).
## Run it headless

Invoking the Editor directly, without `-quit`: [references/headless-run.md](references/headless-run.md).
## Verify

```bash
# Every requested id should appear as a dependency
cat "<project-path>/Packages/manifest.json"
```

Confirm the run exited `0` and each package from the list is present in `manifest.json`. If a
package fails to resolve, `_request.Error.message` is logged; read it and check the id/version
against the registry. The Editor's own log (including the `[PackageInstaller]` lines) is the
stdout you streamed with `-logFile -` above — read it there, not via `unity logs` (which shows
the CLI's own log, not the Editor's).

## Import & save headlessly (generate `.meta` files)

After a script or tool writes new `.cs`/asset files, Unity must **import** them so it generates
the `.meta` file each asset needs — and every `.cs`/asset MUST be committed together with its
`.meta`. Merely opening the project once (`unity open "<project-path>"`) imports and generates
them; use this method when you need it **headless** (in a script or CI).

Unlike the package installer, this is **synchronous** — it finishes before returning — so it's
safe to run via `unity run` (its injected `-quit` is harmless; the method also calls
`EditorApplication.Exit` for a clean exit code). Write
`Assets/Editor/ProjectBootstrap/ProjectSaver.cs`:

```csharp
using UnityEditor;
using UnityEngine;

namespace ProjectBootstrap
{
    public static class ProjectSaver
    {
        // Invoke with: -executeMethod ProjectBootstrap.ProjectSaver.SaveAll
        public static void SaveAll()
        {
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            AssetDatabase.SaveAssets();
            Debug.Log("[ProjectSaver] Assets imported and saved.");
            EditorApplication.Exit(0);
        }
    }
}
```

```bash
unity run "<project-path>" --editor-version <version> \
  -- -executeMethod ProjectBootstrap.ProjectSaver.SaveAll
```

## Notes

- These editor scripts are a bootstrap convenience. Leave them in
  `Assets/Editor/ProjectBootstrap/` (they do nothing unless invoked) or delete them after
  setup — your call; mention it to the user.
- All scripts live under `Editor/` because they use `UnityEditor`; they never ship in a build.
- Monetization / backend packages (`com.unity.purchasing`, `com.unity.services.levelplay`, the
  UGS packages) install through this same mechanism, but do the actual **integration** via the
  dedicated skills: **implement-in-app-purchases**, **levelplay-unity-integration**,
  **build-live-game**.
