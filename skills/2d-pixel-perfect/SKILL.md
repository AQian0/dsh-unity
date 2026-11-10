---
name: 2d-pixel-perfect
description: Sets up, diagnoses, and fixes pixel perfect 2D rendering with PixelPerfectCamera in URP or Built-in. Use when a retro-style or pixel art 2D game looks blurry, jittery, or misaligned. Not for HD 2D or high-resolution art.
---

Set up, diagnose, and fix pixel perfect 2D rendering in Unity projects.

---

## ⚠ There Are Two Completely Separate Implementations

Pixel perfect rendering in Unity is **not one system** — it is two separate, incompatible implementations, one per render pipeline. **Always detect the pipeline before writing or diagnosing any code.** 

| | URP | Built-in |
|---|---|---|
| **Component** | `UnityEngine.Rendering.Universal.PixelPerfectCamera` | `UnityEngine.U2D.PixelPerfectCamera` |
| **Package** | Built into URP — no extra install | `com.unity.2d.pixel-perfect` v6.0.0+ |
| **API style** | Enums (`gridSnapping`, `cropFrame`) | Booleans (`pixelSnapping`, `upscaleRT`, `cropFrameX/Y`) |

**Do not install `com.unity.2d.pixel-perfect` in a URP project.**

**→ Always call `DetectPipeline()` first** (`references/pipeline-detection.cs`), then branch your setup, diagnostics, and fixes based on the result.

---

## When NOT to use this skill

- **HD 2D or high-resolution 2D games** — pixel snapping and point filtering will make smooth art look wrong
- **UI-only scenes** — use Canvas Scaler instead
- **HDRP projects** — Pixel Perfect Camera is not supported

---

## Critical Reminders

⚠ **Detect the render pipeline first** — URP and Built-in use different Pixel Perfect Camera components that are not interchangeable.
⚠ **Filter Mode = Point is the #1 fix** — bilinear filtering is Unity's default and is almost always the cause of blurry sprites.
⚠ **Anti-Aliasing must be disabled** — in Quality Settings and on the camera. AA actively blurs pixel edges.

## Key Principles

### 1. Pipeline Detection & Camera Component Selection

See the two-path comparison table at the top of this file. Assembly name note: the standalone Built-in package installs into a `Runtime/` folder, but the asmdef `"name"` field is `Unity.2D.PixelPerfect` — no `Runtime` suffix. HDRP is unsupported — see the HDRP fallback in `references/common-issues.md`.

**→ Code: `references/pipeline-detection.cs`** — `DetectPipeline()`, `GetPixelPerfectCameraType()`, and migration mismatch check.

### 2. Diagnostic-First Approach

Always diagnose before making changes. Report findings, then fix only what is broken.

### 3. Work in the correct scope

Default to scene scope. Scan project-wide only when the user explicitly requests it.

---

## Diagnostic Checklist

**Sprite import settings:**
- [ ] Filter Mode = `Point (no filter)` on all in-scope sprites
- [ ] Mip Maps = disabled
- [ ] Compression = `None` / Uncompressed
- [ ] PPU consistent across all sprites in scene
- [ ] Sprite pivots set to Custom / Pixels mode — a center pivot on an odd-dimension sprite (e.g. 15×15) lands at 7.5px, causing 0.5px misalignment

**→ Code: `references/sprite-settings.cs`** — `GetImporter()` and `FixSpriteImportSettings()`.

**Editor snap settings:**
- [ ] Grid Size = `1 / assetsPPU` on all axes (e.g. PPU 16 → 0.0625, PPU 100 → 0.01)
- [ ] Grid Snapping enabled in the Grid and Snap overlay
- [ ] To snap existing GameObjects: select them → Align Selected → All Axes

**Camera setup:**
- [ ] Camera projection = Orthographic
- [ ] Pixel Perfect Camera component present and correct type for pipeline
- [ ] `allowHDR`, `allowMSAA`, `allowDynamicResolution` all `false`
- [ ] Scene view shows two green bounding boxes on the camera gizmo — solid = visible area, dotted = reference resolution

**→ Code: `references/camera-setup-urp.cs`** — full URP camera + PP Camera configuration.
**→ Code: `references/camera-setup-builtin.cs`** — Built-in standalone configuration.

**Project quality settings:**
- [ ] Anti-Aliasing = 0 in Quality Settings
- [ ] Anisotropic Filtering = Disabled

---

## API Reference

Full property/method tables, `GridSnapping` and `CropFrame` enum values, and recommended configurations:
**→ `references/api-reference.md`** — read this when writing or reviewing camera setup code.

Quick enum summary:

**`GridSnapping`**: `None` · `PixelSnapping` (standard) · `UpscaleRenderTexture` (authentic low-res; incompatible with post-processing and UI text)

**`CropFrame`**: `None` · `Pillarbox` · `Letterbox` · `Windowbox` (safest default) · `StretchFill`

---

## Reference Resolution

Choose before building any assets. Never change after asset production starts.

| Reference resolution | 1080p | 1440p | 4K |
|---|---|---|---|
| 320 × 180 | 6× | 8× | 12× |
| 480 × 270 | 4× | ~5.3× | 8× |
| 640 × 360 | 3× | 4× | 6× |

320×180 is the safest general choice. For screens with no integer fit (e.g. 1366×768), use `cropFrame = Windowbox` to add black bars rather than stretching to a fractional scale.

---

## Troubleshooting

Read [common issues, migration, and the HDRP fallback](references/common-issues.md) when a fix did
not take, when the camera carries the wrong component, or when the project is on an older URP
namespace. It holds the two migration paths (URP project with the Built-in standalone component;
pre-2022 `UnityEngine.Experimental.Rendering.Universal`) and the symptom → cause → fix matrix:
blurry sprites, tilemap gaps, the Cinemachine conflict, post-processing blur and blurry UI text
with `upscaleRT`, physics/render desync, non-integer scaling, the missing URP 2D Renderer, and the
HDRP fallback.

Fix only what the diagnosis names, then re-run the [Diagnostic Checklist](#diagnostic-checklist) —
a change that does not move a checklist item is not a fix.
