# Step 8 — Save & first commit

The project is already open from Step 7, so `.meta` files exist (`unity open "<project-path>"`
only if not — headless/CI uses the "Import & save headlessly" method in
`unity-package-management`). Commit **with whichever VCS you set up in Step 4**:

- **Git (GitHub / GitLab / local):**
  ```bash
  cd "<project-path>"
  git add -A
  git status                    # Library/ Temp/ obj/ Build/ must NOT be staged
  git commit -m "Initial Unity project: <Name>"
  ```
  Every `.cs`/asset is committed together with its `.meta`.
- **Unity Version Control (UVCS):** check in through the workspace from Step 4 — no `git` step;
  generated folders stay excluded by the ignore rules.

If Step 7 mirrored skills into the project, ask whether to include them. If Step 4 linked
**without** `--no-initial-commit`, the CLI already committed the bare project — add a follow-up
commit rather than double-committing.

