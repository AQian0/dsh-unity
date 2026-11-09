# Step 9 — Hand off

Based on Step 2 monetization, invoke the matching skill for the actual integration:
- IAP → **implement-in-app-purchases**
- Ads → **levelplay-unity-integration**
- Accounts / cloud save / economy / remote config / leaderboards → **build-live-game**

If the matching skill isn't loaded, point the next steps at the skill-setup install route rather
than integrating from memory.

**Offer the forward baton** (declared on the manifest; not on a `--bare` run): one idempotent line
for the project's `CLAUDE.md` or `AGENTS.md` — "When building gameplay, feel, audio, shell, or live
features, load the `craft-game-floors` skill; if it isn't installed, ask the user whether to run
`unity skill install <client>` (ask: never run it without a yes)." That file steers every later
agent session in the project, so **ask before writing it**, even in paved mode, and show the line.
On a yes, append it and commit the note — appended after Step 8, it otherwise never reaches clones.
On a no, put the line in the report for the user to add. Later sessions reach the floors through
it without this skill re-triggering.

Report the project path, Editor version, pipeline and template, packages, the manifest with its
reconciliation, identity state, the baseline applied, any missing skill, `craft-game-floors`'s done gate
as the build's finish line, and next steps.

