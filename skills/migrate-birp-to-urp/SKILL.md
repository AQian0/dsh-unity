---
name: migrate-birp-to-urp
description: Plans, executes, and troubleshoots migration from the Built-in Render Pipeline to URP. Use when asked to convert a project, scene, material, or shader to URP, or to fix visuals broken by the change.
---
Classify the request, inspect the current project state, choose the correct migration path, and validate the Built-in to URP migration outcome carefully.

## Mandatory Execution Reference

For any actual migration or repair pass, read [references/implementation-patterns.md](references/implementation-patterns.md) before the first `script eval` call that edits project settings, materials, post-processing, lighting, probes, or scenes. This is mandatory even for short prompts such as "migrate this project to URP" when rollback safety is already confirmed.

If that resource cannot be loaded, use the embedded rules in this SKILL.md and lower your confidence: do not claim PPv2 conversion, lighting/probe refresh, or migration completion from intent or tool logs alone.

## Critical Default

For a generic "migrate this project to URP" request, run phases 0-4: inspect and plan, URP setup and material conversion, post-processing and cameras, lighting and probes, validation and report. Read [Critical Default](references/preflight-and-urp-setup.md#critical-default) before starting and before any success claim: it holds the upgrade contract and the success gate.

## Execution path: running C# in the Editor

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

### Passing C# to `script eval`

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

### Two execution modes — pick by the snippet's shape

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

### Detecting the active render pipeline

Read [pipeline detection](references/preflight-and-urp-setup.md#detecting-the-active-render-pipeline) for the snippets that tell Built-in, URP, and HDRP apart.

## 0. Pre-Flight: Pipeline Detection and Reference Loading

Read [0. Pre-Flight](references/preflight-and-urp-setup.md#0-pre-flight-pipeline-detection-and-reference-loading) first; it fixes the migration mode and the reference set.

## 1. Assess Current Migration State

Read [assess current state](references/preflight-and-urp-setup.md#1-assess-current-migration-state) to inventory materials, shaders, scenes, volumes, lighting, and probes.

## 2. Gather Requirements

Read [gather requirements](references/preflight-and-urp-setup.md#2-gather-requirements) when the request is ambiguous.

## 3. Safety Gate

Read [safety gate](references/preflight-and-urp-setup.md#3-safety-gate) before any rollback-sensitive step.

## 4. Choose the Migration Path

Read [migration paths](references/conversion-and-rendering-triage.md#4-choose-the-migration-path) before choosing a workflow.

## 5. URP Setup Workflow

Read [URP setup](references/preflight-and-urp-setup.md#5-urp-setup-workflow) when installing or assigning URP, or after a package-refresh boundary.

## 6. Conversion Workflow

Read [conversion workflow](references/conversion-and-rendering-triage.md#6-conversion-workflow) when running Render Pipeline Converter and checking its saved results.

## 7. Shader and Material Triage

Read [shader triage](references/conversion-and-rendering-triage.md#7-shader-and-material-triage) when materials are magenta or shaders fail to compile.

## 8. Post-Processing, Cameras, and Rendering-Effect Triage

Read [rendering-effect triage](references/conversion-and-rendering-triage.md#8-post-processing-cameras-and-rendering-effect-triage) when PPv2, camera effects, or replacement shaders are in scope.

## 9. Quality, Lighting, and Visual Parity Review

Read [parity review](references/parity-validation-and-troubleshooting.md#9-quality-lighting-and-visual-parity-review) when the scene looks wrong after migration.

## 10. Validation

Read [validation](references/parity-validation-and-troubleshooting.md#10-validation) before reporting results.

## 11. Troubleshooting Decision Tree

Read [troubleshooting tree](references/parity-validation-and-troubleshooting.md#11-troubleshooting-decision-tree) when the user reports a migration symptom.

## 12. Core Guardrails

- Detect the active render pipeline first; for HDRP, explain the mismatch and offer only basic comparison guidance.
- Do not mutate the project before rollback safety is confirmed; instead stop in planning mode before URP install, asset assignment, converters, material edits, or scene edits.
- Do not treat tool logs or created assets as proof; instead save/reload/re-query Graphics, Quality, materials, Volumes, lighting, probes, Console, and representative scenes before status claims.
- Do not collapse partial phases into project-level completion; instead report `Phase complete`, `Partial migration`, and `Manual follow-up` based on the success gate.
- Do not bulk-rewrite fragile rendering code; instead use scoped mappings for custom shaders, `GrabPass`, `OnRenderImage`, replacement shaders, package-owned render code, and unsupported PPv2 effects.

## 13. Reporting Back

Summarize:

- which migration path was used
- whether the project is still Built-in, partially migrated, or fully on URP
- which converters ran
- what was fixed automatically
- what still needs manual work
- which scenes, materials, or cameras were validated
- what remains risky, especially around complex shaders, package effects, and visual parity
- whether post-processing was fully migrated, partially prepared, or only documented for manual follow-up
- whether Quality levels are explicitly assigned or intentionally relying on Graphics settings fallback
- whether particle/VFX materials were converted or still need URP particle-shader follow-up
- whether baked lighting/lightmaps/reflection probes were preserved as reference, verified visually, rebaked/refreshed, or left as manual follow-up
- whether exposure, tonemapping, ambient fill, and camera/Volume post-processing wiring were visually balanced or still remain partial

Use completion language conservatively. If the report contains any `Partial`, `Manual follow-up`, `not validated`, `may still need`, or unsupported-feature item, state that specific completed phases passed and call the overall migration partial/manual. Do not pair a project-level "complete" claim with manual follow-up bullets.

## References

- [Migration Workflow](references/migration-workflow.md)
- [Custom Shader Triage](references/custom-shader-triage.md)
- [Complex Shader Situations](references/complex-shader-situations.md)
- [Quality Settings Map](references/quality-settings-map.md)
- [Implementation Patterns](references/implementation-patterns.md)

When this skill is activated, proactively read [references/migration-workflow.md](references/migration-workflow.md). If the request involves materials, shaders, magenta materials, custom rendering, or fullscreen effects, also read [references/custom-shader-triage.md](references/custom-shader-triage.md) and [references/complex-shader-situations.md](references/complex-shader-situations.md). If the request involves visual mismatch, lighting, baked lighting, lightmaps, reflection probes, shadows, or performance after migration, also read [references/quality-settings-map.md](references/quality-settings-map.md). If the user permits actual migration changes or asks to continue/repair a partial migration, also read [references/implementation-patterns.md](references/implementation-patterns.md).
