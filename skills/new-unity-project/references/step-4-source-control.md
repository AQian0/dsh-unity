# Step 4 — Source control

**Paved:** local git + Unity `.gitignore`. **Guided:** ask — Git (GitHub / GitLab; `--git-lfs` for
asset-heavy games), **Unity Version Control** (`--vcs uvcs` — large binaries natively, no LFS), or
purely local. Attach with `unity projects link vcs "<project-path>" --vcs …
--git-token-from-stdin --no-initial-commit` (tokens on stdin) — **`--no-initial-commit`** keeps
the CLI from committing the bare project before packages and `.meta` files exist; the real first
commit is Step 8. Exact flags: the `unity-cli` workflow.

