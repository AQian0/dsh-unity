# Detecting the active render pipeline

```csharp
var rp = UnityEngine.Rendering.GraphicsSettings.defaultRenderPipeline;
var qrp = UnityEngine.QualitySettings.renderPipeline;
return $"graphics={(rp == null ? "NULL (Built-in)" : rp.GetType().Name + ":" + rp.name)}, "
     + $"activeQualityLevel={(qrp == null ? "inherits Graphics" : qrp.GetType().Name + ":" + qrp.name)}";
```

A `UniversalRenderPipelineAsset` means URP; `HDRenderPipelineAsset` means HDRP; `NULL` on both
means Built-in. **Check the per-quality-level assignment too** — a project can be switched in
Graphics settings while a Quality level still points at a different asset, or at none:

```csharp
var names = UnityEngine.QualitySettings.names;
var rows = new System.Collections.Generic.List<string>();
for (int i = 0; i < names.Length; i++)
{
    var a = UnityEngine.QualitySettings.GetRenderPipelineAssetAt(i);
    rows.Add($"{i}:{names[i]}={(a == null ? "inherits Graphics" : a.name)}");
}
return string.Join(", ", rows);
```

If `GetRenderPipelineAssetAt` is unavailable in the project's Unity version, read
`ProjectSettings/QualitySettings.asset` instead rather than switching levels at runtime —
`SetQualityLevel` mutates project state.
# Critical Default

For simple requests like "migrate this Built-in project to URP" or "move this project to URP", start or resume the safe migration workflow rather than jumping straight to conversion.

A generic upgrade prompt must not require the user to mention every migration risk. Inspect and handle common Built-in dependencies such as PPv2, baked lighting/lightmaps, reflection probes, particle/fog/smoke materials, Quality levels, camera post-processing, and representative scene validation.

Default result is phase-based:

1. Detect whether the project is Built-in, partially migrated, already URP, or HDRP.
2. Classify the request as standard 3D URP, URP 2D, selected-material conversion, planning-only, or troubleshooting.
3. Inspect migration risks before recommending changes: opaque materials, particle/VFX materials, custom shaders, post-processing, camera effects, baked lighting/lightmaps/reflection probes, Quality levels, and representative scenes.
4. Stop before any pipeline-mutating work until the user confirms a rollback point such as a branch, backup, archive, or disposable copy. Pipeline-mutating work includes installing URP, assigning a URP asset in Graphics/Quality settings, running converters, and editing materials or scenes.
5. Choose the next migration phase, execute that phase, save/re-query its outputs, and report its phase status.
6. Treat custom shaders, `GrabPass`, Surface Shaders, `OnRenderImage`, replacement shaders, and package-owned shaders as scoped follow-up work, not automatic converter work.
7. Validate representative scenes, Console output, camera rendering, lighting/baked GI state, materials, post-processing persistence, and quality-level assignments before declaring full migration success.

Default phases:

- Phase 0: Inspect and plan. Detect pipeline state, representative scenes, rollback safety, PPv2, material/shader risks, Quality levels, lighting/lightmap/probe state, and custom render code.
- Phase 1: URP setup and supported material conversion. Install/reuse URP, create/assign URP assets in Graphics/Quality, convert supported opaque and particle/effect materials, and verify no supported materials remain on Built-in shaders.
- Phase 2: Post-processing and camera migration. Create persistent URP Volume profiles, wire scene Volumes/camera post-processing, disable legacy PPv2 for URP validation, and classify unsupported PPv2 effects such as SSR.
- Phase 3: Lighting, lightmaps, and reflection probes. Resolve stale Built-in lighting state, configure URP lighting/probe settings, rebake/refresh when feasible, or clearly mark lighting/probes partial.
- Phase 4: Final validation and report. Save/reload/re-query project state, capture representative scenes, check Console, and report complete/incomplete/manual items.

One turn may complete multiple phases if the project is small and Unity remains stable, but do not force all phases into one response. Prefer an honest phase boundary over an over-claimed "complete" result.

Ask configuration questions only when the project state or user intent leaves a real decision unresolved. If the user says "do not modify files", stay in audit/planning mode and do not perform conversion or asset edits.

## Generic Upgrade Contract

When the user gives a generic migration request and permits changes, drive the next phase from the project state:

1. Do not ask the user to enumerate known Built-in features before inspection. Discover them.
2. If PPv2, baked lighting, reflection probes, particle/fog/smoke materials, or multiple Quality levels exist, include them in the migration automatically.
3. Prefer phase completion over all-in-one completion. Each phase should save/re-query its own outputs and end with `Phase complete`, `Phase partial`, or `Blocked`.
4. If Unity compilation, package installation, domain reload, or a long lighting bake interrupts the pass, report the interruption as a phase boundary and resume from saved partial state in the next turn rather than starting over.
5. Do not rely on the user writing a detailed checklist prompt to get correct behavior. The detailed checklist is for benchmarking or stress testing; normal user prompts should still trigger this phased contract.
6. A generic migration request gives permission to inspect and plan, but it does not prove rollback safety. If no rollback point is confirmed, stop before package install or URP assignment and ask for confirmation. Do not leave the project in a magenta partial state just to reach the backup question.
7. If rollback safety is already confirmed or the user says the project is a disposable copy, continue within the current phase without asking again for routine work.
8. At the end of a phase, give a concise next-phase prompt or say what phase should run next. Ask for confirmation before the next phase only when it introduces a new costly or risky operation, such as a long lighting bake, deletion/cleanup of legacy assets, or a custom shader rewrite.
9. If rollback safety was confirmed and ordinary work inside the active phase remains incomplete, do not ask "would you like me to continue?" Continue repairing that phase until its gate passes, a tool/domain-reload boundary interrupts execution, or a genuinely new risky decision appears.

## Generic Migration Success Gate

Before saying a generic migration is "successful", "complete", or "fully migrated", verify saved project state, not just tool logs:

1. Graphics settings and every relevant Quality level point to the intended URP asset.
2. The URP asset has a valid default renderer in saved state, and current Console output does not contain unresolved render-pipeline errors such as "Default Renderer is missing". If a renderer error appears after assignment, re-query the saved renderer list/default index, clear stale Console output when possible, trigger a fresh scene/camera validation, and continue repair instead of stopping at "URP setup complete".
3. Supported Built-in materials, including particle/fog/smoke materials, have URP-compatible shaders or are explicitly listed as unresolved custom/package shader cases. Textured/colorized source materials must preserve their source maps/colors; a URP shader assignment with missing `_BaseMap` or all-white `_BaseColor` is incomplete if the source `_MainTex` or `_Color` had content. Particle, fog, smoke, steam, decal, VFX, additive, and transparent effect materials should not be blindly forced to `Universal Render Pipeline/Lit`; prefer URP particle/effect shaders such as `Universal Render Pipeline/Particles/Unlit` when appropriate.
4. If the source scene used PPv2, a saved URP `VolumeProfile` exists with persistent non-null override components, the representative scene references it through a URP `Volume`, and legacy PPv2 is disabled for URP visual validation. A saved profile with `components: []`, `{fileID: 0}` component refs, or a scene that still only references the old `PostProcessProfile` is incomplete.
5. If the representative scene uses baked/mixed lighting, an Enlighten/realtime-GI Lighting Settings asset, a Lighting Data asset, lightmaps, light probes, or reflection probes, do not leave routine lighting/probe repair as manual follow-up during a generic full migration. Attempt URP-compatible Lighting Settings assignment, clear/rebake or resume a bake when needed, refresh reflection probes when feasible, then save/reload and verify the scene references the intended lighting state. Creating a `.lighting` asset and calling `Lightmapping.lightingSettings = target` plus `AssetDatabase.SaveAssets()` is not enough; mark/save the scene, reload/re-query, and compare the saved scene `m_LightingSettings` reference or asset GUID. If a long bake or tool interruption prevents this, call the migration partial and resume from that phase.
6. A representative scene has been opened or selected deliberately before migration validation; do not infer baked-lighting or PPv2 absence from a default/test scene. The scene has been captured or inspected after saving/reloading, and Console output has been checked for render-pipeline, shader, or renderer-feature errors.
7. Final wording must match the gate result. Use "complete" only when every gate passes. Use "partial" when URP is set up but PPv2 Volume persistence, legacy PPv2 disablement, lighting bake/probe refresh, or saved-state validation remains. Do not start the final response with "successfully migrated" if any required gate is partial.

Complete-report checklist:

- If the old PPv2 profile contains active `DepthOfField`, the new URP profile must contain a saved `DepthOfField` override or the final report must call it omitted/manual.
- If the old PPv2 profile contains active `AmbientOcclusion`, configure a URP SSAO renderer feature when feasible, or mark AO as manual/partial.
- If the old PPv2 profile contains active `ScreenSpaceReflections`, list SSR as unsupported/manual unless a URP renderer-feature/custom replacement was actually added and validated.
- If the scene still serializes the old Lighting Settings GUID or a non-zero old `m_LightingDataAsset`, lighting is partial.
- If the scene has reflection probes and the URP asset still serializes `m_ReflectionProbeBlending: 0` or `m_ReflectionProbeBoxProjection: 0`, reflections are partial unless intentionally disabled and reported.
- If any checklist item is false, do not use "complete", "fully migrated", or "fully functional on URP" in the final answer.

Unsupported features can remain manual, but name them precisely. Examples include PPv2 Screen Space Reflections needing a URP renderer-feature/custom/third-party replacement, complex custom shader ports, `GrabPass`, replacement shaders, or package-owned rendering code. If any success-gate item fails, continue repairing when allowed or report a partial migration with incomplete items; do not present the project as fully migrated.

Regression guard summary:

- Use the detailed [Execution Regression Checklist](implementation-patterns.md#execution-regression-checklist) for actual migration or repair work.
- Verify saved scene references before status claims: URP Volume/profile, Quality assignments, Lighting Settings/Data, URP asset/renderer, and reflection-probe settings.
- Preserve material source data from a pre-conversion snapshot, then restore `_BaseMap`, `_BaseColor`, texture scale/offsets, and relevant maps after shader changes.
- Validate representative visuals for PPv2, foliage, particles/effects, baked lighting, probes, and exposure before final wording.
- Report exact phase status. `Phase complete` is allowed for a passed phase; project-level `complete` is allowed only when every success gate passes.
# 0. Pre-Flight: Pipeline Detection and Reference Loading

Before doing anything else, you **must determine the active render pipeline and migration mode**:

1. **Detect Pipeline:** Run the render-pipeline detection snippet from the execution-path section above.
   - If `currentRenderPipeline` or `defaultRenderPipelineAsset` references a `UniversalRenderPipelineAsset` -> **URP**.
   - If no render pipeline asset is assigned -> **Built-in**.
   - If it references an `HDRenderPipelineAsset` -> **HDRP**. Explain that this skill only covers Built-in to URP migration. Basic comparison advice is fine, but do not drive an HDRP migration with this skill.
2. **Load Base Reference:** Read [references/migration-workflow.md](migration-workflow.md).
3. **Load Shader References When Relevant:** If the request mentions materials, shaders, magenta materials, rendering errors, image effects, or custom rendering, also read:
   - [references/custom-shader-triage.md](custom-shader-triage.md)
   - [references/complex-shader-situations.md](complex-shader-situations.md) when inspection or project-file search finds advanced shader/effect patterns
4. **Load Quality Reference When Relevant:** If the request mentions shadows, lighting, baked lighting, lightmaps, reflection probes, quality settings, visual mismatch, or performance after migration, also read [references/quality-settings-map.md](quality-settings-map.md).
5. **Load Implementation Patterns When Executing:** If the request permits actual migration changes, post-processing conversion, baked-lighting/probe repair, or resume from a partial migration, also read [references/implementation-patterns.md](implementation-patterns.md).
6. **Classify the Request** as one of:
   - Full-project Built-in to URP migration
   - Built-in 2D to URP 2D migration
   - Selected material-only conversion
   - Planning / explanation only
   - Troubleshooting after a previous migration
7. **If the project is already on URP,** switch to troubleshooting mode instead of re-running setup blindly.
8. **Proceed** only after the pipeline and migration path are clear.
# 1. Assess Current Migration State

Before making any changes, **inspect what already exists**:

1. **Inspect pipeline state and assignment points:**
   - Run both render-pipeline detection snippets from the execution-path section above — the Graphics-settings one and the per-quality-level one.
   - If the project has Quality levels, inspect which Render Pipeline Asset each level uses before assuming the project is fully switched.
2. **Inventory migration surfaces:** Use `script eval` with `UnityEditor.AssetDatabase.FindAssets` or equivalent asset queries to inventory:
   - materials, including particle/VFX materials that often use built-in particle shaders
   - vegetation materials, including grass, tree, terrain-detail, SpeedTree, billboard, leaf-card, cutout, and wind-driven foliage materials
   - shaders
   - scenes and important prefabs
   - URP assets and renderer assets, if any
   - post-processing profiles / volume profiles
   - Lighting Settings assets, Lighting Data assets, lightmaps, light probes, reflection probes, and mixed/baked lights
3. **Scan for rendering risk markers:** Use available project-file search, `AssetDatabase.FindAssets`, or a short `script eval` file scan to search the project for rendering-specific patterns such as:
   - `PostProcessLayer`, `PostProcessVolume`, `UnityEngine.Rendering.PostProcessing`
   - `OnRenderImage(`, `RenderWithShader`, `SetReplacementShader`
   - `#pragma surface`, `GrabPass`, `CGPROGRAM`
   - `CommandBuffer`, custom shader include paths, or package shader namespaces
   - vegetation markers such as `Nature/`, `SpeedTree`, `TreeCreator`, `Grass`, `Foliage`, `_Cutoff`, `_AlphaClip`, `_Cull`, billboard, or wind keywords
4. **If PPv2 is installed but grep finds nothing,** inspect open scenes and profile assets through Unity APIs by component/type. Scene YAML and serialized package references can be missed by text search.
5. **Determine project shape:** Decide whether the project is primarily 3D, primarily 2D, or mixed.
6. **Report Findings:** Summarize the current state before proposing conversion. Example:
   - "The project is still on Built-in, has no URP asset assigned, contains PPv2 references, and includes several custom shaders using surface-shader syntax."
# 2. Gather Requirements

Determine what the user actually wants. If the request is ambiguous, ask.

Use these defaults for common requests:

| User says | Default interpretation |
|-----------|------------------------|
| "Upgrade this project to URP" | Full-project migration |
| "Move this 2D project to URP" | Built-in 2D to URP 2D migration |
| "Convert these materials" | Targeted material conversion |
| "My materials turned pink" | Post-migration shader/material troubleshooting |
| "Lighting looks wrong after URP" | Quality and visual parity troubleshooting |
| "Do not change anything yet" | Planning / audit only |

## Information to Gather

- **Scope:** full project, selected materials, or troubleshooting only
- **Target renderer:** standard URP or URP 2D
- **Validation targets:** which scenes, prefabs, or cameras matter most to the user
- **Risk tolerance:** whether limited manual follow-up is acceptable
- **Rendering dependencies:** custom shaders, Asset Store shaders, PPv2, baked lighting/lightmaps/probes, image effects, command buffers, replacement shaders, or multiple Quality levels
- **Execution permission:** planning only vs actual project changes
# 3. Safety Gate

Before any pipeline-mutating step:

1. **Confirm rollback safety.**
   - NEVER install URP, assign a URP asset, run the Render Pipeline Converter, edit materials, or edit migration scene state before the user confirms a backup, branch, archive, disposable copy, or rollback point.
   - If rollback safety is missing, do not partially switch the project to URP. Stop in planning mode and ask for the rollback confirmation first.
2. **Separate engine-upgrade risk from pipeline-upgrade risk.**
   - If the project is also moving to a new Unity version, recommend doing the engine upgrade first and the pipeline migration second. Do not treat both as a single blind operation.
3. **If rollback safety is confirmed,** treat it as covering the whole migration pass. Do not ask again before each converter; proceed through setup, material conversion, PPv2 migration, lighting/probe work, save/reload verification, and final reporting unless a new risky decision appears.
4. **If the user already authorized a full disposable migration,** do not ask for permission to continue after routine setup or recoverable errors. Continue with the next incomplete migration phase. Ask only when a new destructive cleanup decision appears, a package/domain reload stops execution, or repeated repair attempts hit the validation iteration limit.
4. **If the project is already partially migrated,** identify whether rollback safety was previously confirmed. If yes, resume from the first incomplete item. If no, report the partial state and ask before making additional changes.
# 5. URP Setup Workflow

Follow this exact setup order:

1. **Ensure URP is installed.**
   - Installing URP can trigger package refresh, compilation, and domain reload. Treat this as a phase boundary.
   - Do not spin-wait indefinitely inside an `script eval` call on `UnityEditor.PackageManager.Client.Add`. Request installation, then verify through `Packages/manifest.json`, package listing, or the presence of URP types/assets after Unity finishes refreshing.
   - If the package install causes the `script eval` call to time out or return nothing, resume in a fresh turn after Unity finishes compiling. Do not restart the whole migration or reinstall URP; inspect the partial state and continue from there.
2. **Create the required URP asset and renderer asset** if they do not already exist.
3. **Assign the URP asset in Graphics settings** and in all relevant Quality levels.
4. **For 2D projects,** create and assign the correct 2D Renderer asset before conversion.
5. **If a URP asset already exists,** inspect and reuse it when appropriate instead of creating duplicates automatically.
6. **Do not continue** until URP is actually the active render pipeline for the target configuration.

