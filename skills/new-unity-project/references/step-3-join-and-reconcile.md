# Step 3 — Join: project ready, result reconciled

Wait for the background create and read its JSON result: `data.path` is the project,
`data.version` the Editor, `data.editorInstalled` whether this run installed it.

**Paved: reconcile the result against the manifest**, narrating divergence — the cloud-link
soft-fail included (`cloudLinked: false`, warnings, project intact; Step 6 keys off it). A 403 on
the link is often the saved default org refusing new projects — retry
`unity projects link cloud <path> --cloud-org <an org the user owns>` before concluding
no-identity. A result carrying a `steps` field reconciles step-by-step from it.

`--module` only applies when the run installs the Editor: on `data.editorInstalled: false`, add
the platform modules with `unity install-modules -e <version> -m <platform-modules> --accept-eula`
(skips what's already there). If create failed, surface the error (`unity-cli` troubleshooting)
and stop — a failed install creates no project, and nothing downstream works without an Editor.

