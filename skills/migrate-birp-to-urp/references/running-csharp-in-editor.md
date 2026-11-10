# Running C# in the Editor

## Execution path

Every C# step in this skill runs inside a live Editor through the Unity CLI. **The `unity-cli`
skill owns getting you there** — installing the CLI, confirming a connected Editor, adding the
project's `com.unity.pipeline` package, telling a genuinely absent Editor apart from one stuck in
Safe Mode, and discovering the Editor's command catalog. Follow it first; don't re-derive any of
it here.

Two things it can't know for you:

- **You need `script eval` in particular**, not just a reachable Editor. Confirm it appears in the
  catalog. Its presence depends on the Pipeline package version, not on the CLI, so a healthy
  install can still lack it — if it's missing, say so and stop.
- **On an Editor older than 6000.3, expect the Pipeline package not to work at all**, and read the
  symptom correctly rather than retrying. `com.unity.pipeline` uses `IPreprocessBuildWithContext`
  and `BuildCallbackContext`, which Unity introduced in **6000.3**; the package's own manifest
  declares `"unity": "6000.0"`, so it installs happily and then fails to compile. Measured:
  present in 6000.3 / 6000.4 / 6000.5, absent in 6000.0 / 6000.1 / 6000.2 and in the 2022 and 2023
  lines. The symptom is misleading — the server never starts, `unity status` shows no row and no
  error, and the real cause is `CS0246` on those two types in the Editor log. If you see that,
  tell the user the Editor is too old for the Pipeline package rather than debugging the CLI.

  **This matters here more than in most skills:** someone migrating a project off the Built-in
  pipeline is, by definition, often on an older Editor.
- **A render-pipeline migration is not safely authorable blind.** Assigning a URP asset, converting
  materials, and rebaking lighting all need a live Editor. An unreachable Editor is a stop, not a
  cue to hand-edit `ProjectSettings/GraphicsSettings.asset`.

Run C# with `unity command script eval --caller plugin --skill migrate-birp-to-urp --code '<snippet>'`. `unity command` defaults to a 30 second
timeout, which matters here: installing URP triggers a package refresh and domain reload that will
outlast it. Treat that as a phase boundary rather than raising the timeout.

## Passing C# to `script eval`

`script eval` compiles a **statement block, not a file**. Three consequences, all of which cause a compile
error rather than a warning:

- **No `using` directives.** The compiler reads `using UnityEngine;` as a resource-disposal
  statement and rejects it (`CS0210`).
- **Types must be fully qualified.** A bare `GraphicsSettings` or `Volume` does not resolve
  (`CS0246` / `CS0103`), and a bare `Object` is ambiguous with `object` (`CS0104`).
- **Extension methods are unavailable**, because they resolve through `using`. Two that this skill
  would otherwise reach for: `camera.GetUniversalAdditionalCameraData()` becomes
  `camera.GetComponent<UnityEngine.Rendering.Universal.UniversalAdditionalCameraData>()`, and LINQ
  calls must be written statically — `System.Linq.Enumerable.FirstOrDefault(sequence, predicate)`
  rather than `sequence.FirstOrDefault(predicate)`.

## Two execution modes — pick by the snippet's shape

The references carry both shapes, and they are not interchangeable:

- **Statement-shaped** (a bare sequence of statements, like the detection snippets above) — pass
  straight to `script eval`, fully qualified, with no `using` lines.
- **Class- or method-shaped** (anything declaring a `class`, a `static` method, or a `[MenuItem]`,
  such as the material-snapshot pattern) — these are **project files, not `script eval` input**. A class
  declaration cannot be flattened into a statement block. Save the snippet under
  `Assets/Editor/`, let Unity compile it, then invoke its entry point through a one-line `script eval`
  call. Keep the `using` directives in that file; they are correct there.

For a multi-step migration the script route is the more reliable one anyway: it survives the domain
reloads that URP installation and material conversion trigger, whereas a long `script eval` payload does
not.

## Detecting the active render pipeline

Read [pipeline detection](references/preflight-and-urp-setup.md#detecting-the-active-render-pipeline) for the snippets that tell Built-in, URP, and HDRP apart.
