---
name: migrate-birp-to-urp
description: Plans, executes, and troubleshoots migration from the Built-in Render Pipeline to URP. Use when asked to convert a project, scene, material, or shader to URP, or to fix visuals broken by the change.
---
Classify the request, inspect the project state, choose the migration path, and validate the Built-in to URP outcome carefully.

## Mandatory Execution Reference

For any actual migration or repair pass, read [implementation-patterns.md](references/implementation-patterns.md) before the first `script eval` that edits project settings, materials, post-processing, lighting, probes, or scenes — mandatory even for short prompts once rollback safety is confirmed.

If it cannot be loaded, use the embedded rules here and lower your confidence: do not claim PPv2 conversion, lighting/probe refresh, or completion from logs alone.

## Critical Default

For a generic "migrate this project to URP" request, run phases 0-4: inspect and plan, URP setup and material conversion, post-processing and cameras, lighting and probes, validation and report. Read [Critical Default](references/preflight-and-urp-setup.md#critical-default) before starting and before any success claim: it holds the upgrade contract and success gate.

## Execution gate: running C# in the Editor

C# steps run in a live Editor through the Unity CLI — the **`unity-cli` skill owns getting you there**; follow it first. Read [running C# in the editor](references/running-csharp-in-editor.md) before the first `script eval` for the command, statement-block constraints, and execution modes.

- **Confirm `script eval` is in the catalog**; if it is missing, say so and stop — its presence depends on the Pipeline package version, not the CLI.
- **An Editor older than 6000.3 cannot run the Pipeline package** (`IPreprocessBuildWithContext`/`BuildCallbackContext` are 6000.3+; the manifest says `"unity": "6000.0"`): the server never starts and the real cause is `CS0246` in the Editor log — tell the user the Editor is too old instead of debugging the CLI.
- **An unreachable Editor is a stop**, not a cue to hand-edit `ProjectSettings/GraphicsSettings.asset`.
- Run it with `unity command script eval --caller plugin --skill migrate-birp-to-urp --code '<snippet>'`; the 30 second default loses to the package refresh and domain reload a URP install triggers — treat that as a phase boundary.

## 0. Pre-Flight

Read [0. Pre-Flight](references/preflight-and-urp-setup.md#0-pre-flight-pipeline-detection-and-reference-loading) first — it fixes migration mode and reference set — and [pipeline detection](references/preflight-and-urp-setup.md#detecting-the-active-render-pipeline) tells Built-in, URP, and HDRP apart.

## 1. Assess State

Read [assess current state](references/preflight-and-urp-setup.md#1-assess-current-migration-state): materials, shaders, scenes, volumes, lighting, probes.

## 2. Gather Requirements

Read [gather requirements](references/preflight-and-urp-setup.md#2-gather-requirements) when the request is ambiguous.

## 3. Safety Gate

Read [safety gate](references/preflight-and-urp-setup.md#3-safety-gate) before any rollback-sensitive step.

## 4. Choose the Migration Path

Read [migration paths](references/conversion-and-rendering-triage.md#4-choose-the-migration-path) before choosing a workflow.

## 5. URP Setup Workflow

Read [URP setup](references/preflight-and-urp-setup.md#5-urp-setup-workflow) when installing or assigning URP, or after a package-refresh boundary.

## 6. Conversion Workflow

Read [conversion workflow](references/conversion-and-rendering-triage.md#6-conversion-workflow) when running the Render Pipeline Converter and checking its results.

## 7. Shader and Material Triage

Read [shader triage](references/conversion-and-rendering-triage.md#7-shader-and-material-triage) when materials are magenta or shaders fail to compile.

## 8. Post-Processing and Cameras

Read [rendering-effect triage](references/conversion-and-rendering-triage.md#8-post-processing-cameras-and-rendering-effect-triage) when PPv2, camera effects, or replacement shaders are in scope.

## 9. Parity Review

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

- which migration path was used; whether the project is still Built-in, partially migrated, or fully on URP
- which converters ran, what was fixed automatically, and what still needs manual work
- which scenes, materials, or cameras were validated, and what remains risky — especially complex shaders, package effects, and visual parity
- whether post-processing was fully migrated, partially prepared, or only documented; whether Quality levels are explicitly assigned or rely on Graphics settings fallback; whether particle/VFX materials still need URP particle-shader follow-up
- whether baked lighting/lightmaps/reflection probes were preserved as reference, verified visually, rebaked/refreshed, or left as manual follow-up
- whether exposure, tonemapping, ambient fill, and camera/Volume post-processing wiring were visually balanced or still remain partial

Use completion language conservatively: if the report contains any `Partial`, `Manual follow-up`, `not validated`, `may still need`, or unsupported-feature item, state which completed phases passed and call the overall migration partial/manual — never pair a project-level "complete" claim with manual follow-up bullets.

## References

Read on activation: [Migration Workflow](references/migration-workflow.md).

- [Custom Shader Triage](references/custom-shader-triage.md), [Complex Shader Situations](references/complex-shader-situations.md) — materials, shaders, magenta materials, custom rendering, fullscreen effects.
- [Quality Settings Map](references/quality-settings-map.md) — visual mismatch, lighting, lightmaps, probes, shadows, performance.

