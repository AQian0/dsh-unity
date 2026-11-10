# Step 9 — Hand off

Based on Step 2 monetization, invoke the matching skill for the actual integration:
- IAP → **implement-in-app-purchases**
- Ads → **levelplay-unity-integration**
- Accounts / cloud save / economy / remote config / leaderboards → **build-live-game**

If the matching skill isn't in the catalog, say so and name the gap in the report rather than
integrating from memory.

**Offer the forward baton** (declared on the manifest; not on a `--bare` run): one idempotent line
for the project's `AGENTS.md` — "When building gameplay, feel, audio, shell, or live features, load
the `craft-game-floors` skill." `AGENTS.md` is the file DSH reads in a project, so that line steers
every later session there. Add it to `CLAUDE.md` only as a compatibility item, when the project
already has one for other clients — same line, nothing more. Both are writes the user must approve:
**ask before writing either**, even in paved mode, and show the line. On a yes, append it and commit
the note — appended after Step 8, it otherwise never reaches clones. On a no, put the line in the
report for the user to add. Later sessions reach the floors through it without this skill
re-triggering.

Report the project path, Editor version, pipeline and template, packages, the manifest with its
reconciliation, identity state, the baseline applied, any missing skill, `craft-game-floors`'s done gate
as the build's finish line, and next steps.
