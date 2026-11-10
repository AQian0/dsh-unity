---
name: urp-postprocessing
description: Sets up, configures, and debugs URP post-processing with the Volume framework. Use for bloom, tonemapping, color adjustments, depth of field, vignette, or other Volume overrides.
required_packages:
  com.unity.render-pipelines.universal: ">=14.0.0"
---

Help the user set up, configure, and debug post-processing effects using URP's Volume framework.

**Goal: The user should have a working visual result with zero console errors after setup.**

## 0. Prerequisite: an Editor you can run C# in

Volume profiles, `VolumeParameter.overrideState`, and the camera's post-processing flags are Editor/runtime object state — the checks and edits below all run C# inside a live Editor.

**The `unity-cli` skill owns getting you there** — the CLI install, a connected Editor, the project's `com.unity.pipeline` package, Safe Mode, and the command catalog. Follow it first; don't re-derive any of it here. You need `script eval` in particular, not just a reachable Editor; if it's missing, say so and stop.

`script eval` compiles a **statement block, not a file**: **no `using` directives** (`using UnityEngine;` reads as a resource-disposal statement, `CS0210`) and every type **fully qualified** (a bare `AssetDatabase` or `Volume` is `CS0246` / `CS0103`; a bare `Object` is `CS0104`). Qualify the types of any snippet written as a file before it reaches `script eval`. Command form, the `script eval_file` caveat and the 30 second timeout: [script-eval.md](references/script-eval.md).

## 0. Pre-Flight Checks

Before configuring any effect, **verify all checks**. Fix failures first.

1. **URP is the active render pipeline** — if not, inform the user and stop.
2. **HDR is enabled on the URP Asset** — required for Tonemapping; in SDR, Bloom needs `threshold` < 1.
3. **The camera has post-processing enabled** — `renderPostProcessing` must be `true` (defaults to `false`). With camera stacking, only a `CameraRenderType.Base` camera (or the last `Overlay`) should enable it, and the Renderer's PostProcessData asset must not be null, or the pass won't exist.
4. **The Volume's layer is in the camera's Volume Layer Mask** — `volumeLayerMask` defaults to layer 0 "Default" only, so the Volume's `GameObject.layer` must be included or the camera ignores it.
5. **The Volume is enabled with a valid Profile and at least one override** — a non-null `profile` (or `sharedProfile`), and at least one `VolumeComponent` with `overrideState = true` on its properties.

Run the [Pre-Flight Setup Verification](references/code-templates.md#pre-flight-setup-verification) template to verify the setup programmatically.

## 1. Volume Setup

Effects are added as **VolumeComponent overrides** on a **VolumeProfile** (a `ScriptableObject`).

**Global Volume** (most common): GameObject with `Volume` component, `isGlobal = true`, `profile` assigned. Affects every camera whose `volumeLayerMask` includes the Volume's layer.

**Local Volume** (optional, but takes precedence): GameObject with trigger `Collider` + `Volume` component, `isGlobal = false`. Properties: `priority` (float; higher overrides lower when volumes overlap), `blendDistance` (float, world units to start blending; 0 = instant transition at the collider boundary), and `weight` (float 0–1, scales the volume's influence).

## 2. Post-Processing Effects

All effects are `VolumeComponent` subclasses added as overrides on a `VolumeProfile` via `profile.Add<T>()`. Check existence with `profile.Has<T>()` or `profile.TryGet<T>(out var t)`. Remove with `profile.Remove<T>()`.

Every property is a `VolumeParameter`. You **must** set `overrideState = true` before setting `value`, otherwise the Volume system ignores it.

When configuring a specific effect, load its properties from [effect-reference.md](references/effect-reference.md) and the code shapes from [code-templates.md](references/code-templates.md) (Global Volume, camera post-processing, profile modification, undoable changes, Pre-Flight verification).

## 3. Anti-Hallucination Rules

### Required Usings

These apply when you write a `.cs` file into the project. **A snippet passed to `script eval` cannot
carry them** — qualify the types instead (see "Passing C# to `script eval`" above).

```csharp
using UnityEngine.Rendering;           // Volume, VolumeProfile, VolumeComponent, VolumeParameter
using UnityEngine.Rendering.Universal;  // Bloom, Tonemapping, ColorAdjustments, UniversalRenderPipeline, etc.
```

### Wrong → Correct API Mapping

| WRONG | CORRECT |
|-------|---------|
| `PostProcessVolume` | `Volume` (from `UnityEngine.Rendering`) |
| `PostProcessLayer` | `UniversalAdditionalCameraData.renderPostProcessing` (bool) |
| `UnityEngine.Rendering.PostProcessing` | `UnityEngine.Rendering.Universal` |
| `profile.GetSetting<T>()` | `profile.TryGet<T>(out var t)` (returns bool) |
| `profile.AddSettings<T>()` | `profile.Add<T>()` (returns T; throws if already exists — check `profile.Has<T>()` first) |
| `volume.sharedProfile` (to modify at runtime) | `volume.profile` (auto-clones the asset into an instance) |
| `VolumeManager.instance.stack.GetComponent<T>()` | `volume.profile.TryGet<T>(out var t)` |

### Key Facts
- **`overrideState = true`** is required on every `VolumeParameter` you set. The volume system skips parameters where `overrideState` is `false`. This is the #1 scripting mistake.
- **`sharedProfile`** = returns the asset directly (edits persist to disk). **`profile`** = auto-clones into an instance if needed (safe for runtime edits). Check with `volume.HasInstantiatedProfile()`.
- **`profile.Add<T>(bool overrides = false)`** — pass `true` to auto-enable `overrideState` on all parameters of the added component.

## 4. Debugging Checklist

When post-processing isn't working, check in order:

1. `cam.TryGetComponent<UniversalAdditionalCameraData>(out var data)` succeeds and `data.renderPostProcessing` is `true`?
2. Volume exists in scene with a non-null `profile` (or `sharedProfile`)?
3. Overrides added via `profile.Add<T>()` AND `overrideState = true` on each property you set?
4. Volume's `GameObject.layer` is included in camera's `data.volumeLayerMask`? (Default mask is layer 0 only.)
5. `volume.isGlobal = true` (for global), or camera is inside the Volume's trigger `Collider` (for local)?
6. Camera `data.renderType` is `CameraRenderType.Base`, not `Overlay`?
7. `UniversalRenderPipeline.asset.supportsHDR` is `true`? Required for Bloom and Tonemapping.
8. Viewing in **Game view**? Scene view has a separate post-processing toggle in its toolbar.

## 5. Common Recipes

Four starting points — Cinematic (Film), Stylized/Vibrant, Horror/Dark, Clean/Mobile — written as Effect property=value: [effect-reference.md](references/effect-reference.md#common-recipes).

## 6. Final Confirmation

After setup, report to user:

```
Post-Processing Setup Complete
- Volume: [Global/Local] on "[GameObject Name]"
- Profile: [Asset Path]
- Effects: [List with key property=value pairs]
- Camera: [Name] — renderPostProcessing=true, volumeLayerMask includes layer [N]

View results in Game view (not Scene view).
Undo all changes with Edit > Undo (Ctrl+Z).
```
