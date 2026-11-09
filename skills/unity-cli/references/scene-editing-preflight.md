# Edit a scene, GameObject, or asset — `unity status` first

**Before editing any scene, GameObject, prefab, or asset, run `unity status` to detect a connected Editor.** If one is reachable, drive it with live commands instead of touching project files — the Editor applies changes to the *actual active scene* and keeps its in-memory state in sync.

```bash
unity status                       # is an Editor connected? (look for state "ready")
unity command                      # discover the scene/GameObject commands THIS Editor exposes
# then drive it with the commands it lists — for example, if your Editor exposes them:
unity command gameobject create   # act on the live, active scene
unity command scene save          # persist the active scene
```

Commands are grouped and invoked as `unity command <group> <name>`. Their names are defined by the Editor, so run `unity command` to see the exact set — don't assume a name.

> **Never hand-edit `.unity`, `.prefab`, or `.asset` YAML while a live Editor is reachable.** Raw-file edits are:
> - **error-prone** — fileIDs and GUIDs are assigned by hand and easy to get wrong;
> - **invisible** to the running Editor until a reimport, so the change silently fails to take effect; and
> - **prone to hitting the wrong file** — e.g. writing to `SampleScene.unity` while the Editor's active scene is actually `Demo2.unity`, producing valid-looking YAML that changes nothing the user sees.

**Rule out two false negatives before concluding no Editor is reachable — both look identical to a genuinely closed Editor, and both are easy to get wrong under time pressure:**

- **Safe Mode.** If an Editor *is* running for this project but `unity command` won't connect, it may be stuck in **Safe Mode** from a compile error rather than genuinely absent. Run `unity status`: if it reports Safe Mode (`STATUS_SAFE_MODE`, with the compile errors), editing the C# source to fix the compile errors *is* the correct move, not a fallback. See [integration-advanced.md → Recovering from Safe Mode](integration-advanced.md#recovering-from-safe-mode-connection-fails-because-of-compile-errors).
- **A sandboxed agent shell.** If your own shell commands run inside a restrictive sandbox — the normal case for a coding agent like this one — the sandbox can hide a genuinely running Editor from `unity status` the same way. This applies to **every** scene/GameObject/prefab/asset task that reaches this preflight, not only ones that obviously need a live Editor: a task you could otherwise finish without any CLI involvement (e.g. generating an asset through ordinary Editor APIs) can still get funneled into "no Editor" here and derailed. Don't treat "no instances" as proof the Editor is down, and don't quietly improvise a third path — like driving a separate headless Editor process to approximate what a live connection would have done — as a substitute for a disclosed file edit. Say plainly that your sandbox may be blocking your view of a real Editor, and ask whether one is actually open before falling back. Full detail: [integration-advanced.md → Sandboxed agent tooling can hide a running Editor](integration-advanced.md#sandboxed-agent-tooling-can-hide-a-running-editor).

Only fall back to editing files directly once you've ruled out both of the above — and say so explicitly ("no live Editor detected, editing the file directly").
