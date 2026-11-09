# Step 2 — Platforms & monetization, then start installing

Two decisions (paved: filled from the Defaults table, then **print the manifest**):

- **Target platforms**: Desktop, Mobile (iOS/Android), WebGL, Console — they map to Editor
  **modules** (`--module`) and argue for leaner packages on mobile/WebGL.
- **Monetization**: none / premium / IAP / ads / mix — this only decides the Step 9 handoff.

Default to an explicit `--editor-version latest` unless the user names a version — without the
flag, create prefers a stored default or an older installed Editor.

Confirm prerequisites, then **start the create as a background task** (`unity-cli` has module
names and auth / license setup):

```bash
unity --version   # sign-in and license: settled before your first question (see above)

# Start in the BACKGROUND. Module names per platform are in the unity-cli skill.
# --bare only on the user's ask (see Mode).
unity projects create "<Name>" --path <dir> --editor-version latest \
  --template <3d|2d> --install-editor --module <platform-modules> --accept-eula --format json
```

The command waits for the install, then creates the project, so its one result covers both. If you
have nothing left to ask, it's fine to just wait.

**Template:** `--template 3d` / `2d` resolve to the version's URP templates
(`com.unity.template.urp-blank`, `com.unity.template.universal-2d`), the default for every game.
Built-in templates (`com.unity.template.3d`/`.2d` as full ids) are deprecated from 6.5, removed in
6.7 — pass one only when the user explicitly asks for Built-in.

