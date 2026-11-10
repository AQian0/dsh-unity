# Skill and Pipeline setup

> Reference for the `new-unity-project` skill. The skills this flow delegates to come with the DSH
> bundle, so nothing is installed and no client route is offered. What is left is the project side:
> the `com.unity.pipeline` package, the `unity-pipeline` guide, and the Pipeline failure codes. The
> body's "Before Step 1" section says *when* to use this; this file says *how*.

## The delegated skills are already available

Every skill the flow names — `unity-cli`, `unity-package-management`, `unity-pipeline`,
`urp-postprocessing`, `ui`, `2d-pixel-perfect`, `craft-game-floors`, `implement-in-app-purchases`,
`levelplay-unity-integration`, `build-live-game` — ships in this bundle and is listed in the
session's skill catalog. Load one with the `skill` tool when a step names it.

- **Don't install, mirror or copy skills** into the project or into any client directory, and don't
  hand the user a `unity skill install` / `unity setup` command: those routes are for other clients
  and would only duplicate what the bundle already provides.
- If a skill is missing from the catalog, say which one it is and what it does for that step, use
  that step's fallback, and name the gap in the report. `unity skill show` prints `unity-cli`'s text
  without installing anything.
- A sandboxed session can refuse a write outside the workspace or a network call. Report the
  refusal and the permission it needs; don't work around it by copying skills into the project.

## The `unity-pipeline` guide (read it once the Editor is ready)

The bundle ships the `unity-pipeline` skill, so read it from the catalog once Step 7 opens the
Editor. If the catalog doesn't list it, read the Pipeline package's own copy of the guide directly:
it sits under `.claude/skills/unity-pipeline/` **inside the package** — `Packages/com.unity.pipeline/`
if the project embeds the package, otherwise the `Library/PackageCache/com.unity.pipeline@*` folder.
List `Library/PackageCache` for the exact name, since the suffix is often a hash, not the version.
That is the package's own layout, not a client install: read the copy again in each session where
the catalog has none.

## Pipeline failure codes and the stuck-Editor recovery

| Symptom | Cause | Resolution |
|---|---|---|
| `PIPELINE_MANIFEST_WRITE_FAILED` on `unity pipeline install` | the project is open in an Editor | ask the user to close the Editor, re-run the install |
| `STATUS_PIPELINE_LOAD_PENDING` right after an install against an open project | the open Editor loads the package when its window regains focus | ask the user to switch to the Editor window |
| `STATUS_PIPELINE_LOAD_PENDING` that never clears after an open | the Pipeline server can run while its port file never lands (package/editor pairing issues) — focus is not the cause | read `Logs/Editor.log` for `Pipeline:` lines to confirm, then recover below |
| Pipeline never connects on Unity 6000.5.0 to 6000.5.2 (create reported `PIPELINE_EDITOR_UNSUPPORTED`) | the package can't start its server on those Editors | don't recover below, reopening won't help: ask the user to update to 6000.5.3f1 or later, run `unity pipeline install` with the project closed (create left the package out), then open it with `unity open "<project-path>" --editor-version <updated-version>` (a plain `unity open` uses the saved 6000.5.x Editor); on 6000.7 or later `unity open` refuses the move, so run `unity projects upgrade "<project-path>" --to <updated-version> --yes`, adding `--no-cloud` when the user declined the cloud link at create |

**Stuck-Editor recovery** (check the project's Editor version first; never on 6000.5.0 to
6000.5.2, see the table): ask the user first — unsaved work is lost — then
`unity close <project> --force`, which terminates by PID and works without Pipeline connectivity,
and reopen the project.
