# Delegated skills

> Reference for the `new-unity-project` skill: what each skill the flow delegates to owns, so no step
> reinvents a command another skill already documents. Every one ships in this DSH bundle and is
> listed in the session's skill catalog.

- **`unity-cli`** — install, auth/license, Editor install, creation, source control, open. Its
  "Bootstrap a new project from scratch" workflow is the backbone here.
- **`unity-package-management`** — packages with the Pipeline `package` commands (C# script fallback
  when no Editor can answer them).
- **`urp-postprocessing`**, **`ui`**, **`2d-pixel-perfect`** — visual-baseline mechanics (Step 7).
- **`craft-game-floors`** — the craft floors (look, feel, audio, shell, live floor, the done gate),
  loaded at Step 6 and carried through the build.
- **`implement-in-app-purchases`**, **`levelplay-unity-integration`**, **`build-live-game`** —
  monetization / backend *integration* (invoked at the end).

If one is missing from the catalog, say which it is and what it does for that step, use that step's
fallback, and name the gap in the report. **Don't install, mirror or copy skills** into the project
or into a client directory, and don't hand the user a `unity skill install` / `unity setup`
command: those routes belong to other clients and would only duplicate what the bundle provides.
