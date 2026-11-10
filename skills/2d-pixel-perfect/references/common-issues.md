# Common issues, migration, and HDRP fallback

> Reference for the `2d-pixel-perfect` skill. The body routes here once the pipeline is known
> (`references/pipeline-detection.cs`) and the checklist has been worked through: this file holds
> the migration paths and the symptom → cause → fix matrix. Detect the pipeline before applying
> anything below — URP and Built-in do not share a component.

## Migration & Compatibility

### URP project with the Built-in standalone component

**Symptom**: `DetectPipeline()` returns URP but camera has `UnityEngine.U2D.PixelPerfectCamera`. Symptoms are subtle because the standalone component has `ENABLE_URP` conditional code.

**Fix**:
1. Remove `com.unity.2d.pixel-perfect` from Package Manager
2. Remove `UnityEngine.U2D.PixelPerfectCamera` from each camera
3. Add `UnityEngine.Rendering.Universal.PixelPerfectCamera`
4. Reconfigure — booleans (`pixelSnapping`, `upscaleRT`, `cropFrameX/Y`) become enums (`gridSnapping`, `cropFrame`)

**→ Detection code: `references/pipeline-detection.cs`** (bottom of file).

### Old URP namespace (pre-Unity 2022 / URP pre-13.x)

**Symptom**: Compiler errors referencing `UnityEngine.Experimental.Rendering.Universal`.

**Fix**: Replace `using UnityEngine.Experimental.Rendering.Universal;` with `using UnityEngine.Rendering.Universal;`. Update any assembly-qualified type strings. The `[MovedFrom]` attribute handles serialization automatically — components on GameObjects survive the upgrade.

## Common Issues & Solutions

### Blurry sprites
**Fix**: Set Filter Mode to Point on all in-scope sprites, disable Mip Maps, disable AA in Quality Settings.
**→ Code: `references/sprite-settings.cs`**

### Tilemap gaps between tiles
Work through in order — workarounds like negative cell gap or PPU = 31.99 break when the camera moves.

| # | Check | Fix |
|---|---|---|
| 1 | Sprite Atlas with Tight Packing off, Padding ≥ 4, Sprite Packer Mode enabled? | Enable Sprite Packer Mode in Editor settings; on the atlas set Padding ≥ 4 and turn Tight Packing off |
| 2 | Mipmaps disabled on tileset textures and atlas? | Disable Generate Mip Maps |
| 3 | AA = 0, MSAA off on camera? | Disable AA globally |
| 4 | Compression = None? | RGBA 32-bit uncompressed |
| 5 | All tile sprites have even pixel dimensions? | Odd dimensions cause 0.5px grid offset |
| 6 | PPU = tile pixel width? (16×16 → PPU 16) | PPU mismatch leaves physical gaps |
| 7 | Gaps only during camera movement after all above pass? | Use PP Camera pixel snapping; do not use `cellGap = -0.01f` |

### Cinemachine conflict
**Cause**: Both Cinemachine and the Pixel Perfect Camera write to orthographic size every frame.

**Fix**: Add `CinemachinePixelPerfect` extension via the Add Extension dropdown on each Virtual Camera. Do not add it via `AddComponent` in code.

**Known limitations**:
- Camera blends between virtual cameras are not pixel-perfect during transitions
- `UpscaleRenderTexture` reduces valid pixel-perfect ortho sizes, which may cause framing to deviate
- Target Group + Framing Transposer causes visible choppiness (no fix available)

### Post-processing blur with `upscaleRT`
**Cause**: Post-processing runs after the PP Camera upscales the render texture.

**Simple fix**: Disable `upscaleRT`. Post-processing then runs at native screen resolution.

**Advanced fix (Unity 6 URP)**: Inject a `ScriptableRendererFeature2D` at `RenderPassEvent2D.AfterRenderingPostProcessing`. Use 2D-specific base classes — `ScriptableRendererFeature` (3D base class) is silently ignored in a URP 2D renderer.

### UI text blurry with `upscaleRT`
**Status**: Known Unity bug, declined to fix (still present Unity 6, 2025).

**Root causes**: (A) Canvas renders into the low-res buffer and is upscaled with the scene. (B) TMP's SDF gradient threshold is miscalibrated at low reference resolutions.

**Fixes in order of reliability**:
1. `Screen Space - Overlay` on Canvas — bypasses the camera, renders at native resolution
2. Dedicated UI camera with no PP Camera component, `Screen Space - Camera` mode
3. Unity 6 only: `Font Material → Debug Settings → Sharpness = 1` (mitigates B, not A)

### Physics / render desync (micro-stutter)
**Cause**: Physics runs at a fixed timestep; interpolated positions produce fractional values that snap to different pixels each frame.

**Fix**:
- Enable `Rigidbody2D.interpolation = RigidbodyInterpolation2D.Interpolate` on physics-driven sprites
- Set `Time.fixedDeltaTime = 1f / 60f` to match target frame rate
- Keep camera tracking in `LateUpdate`, not `FixedUpdate`

### Non-integer scaling / pixel decimation
**Cause**: Screen resolution is not a clean integer multiple of the reference resolution.

**Fix**: Choose a reference resolution from the table in `SKILL.md`. Use `cropFrame = Windowbox` when no integer fit exists.

### Missing URP 2D Renderer
**Fix**:
1. `Assets > Create > Rendering > URP 2D Renderer Data`
2. Assign it to your URP Asset under Renderer List
3. Requires `com.unity.render-pipelines.universal` 12.0+

### HDRP fallback
Pixel Perfect Camera is unsupported in HDRP.

**Built-in / Unity 5.x**: Use `RenderTexture` + `Graphics.Blit` with `FilterMode.Point`.

**Unity 6 URP**: Use `ScriptableRendererFeature2D` + `ScriptableRenderPass2D` injected at `RenderPassEvent2D.AfterRendering` with `AddRasterRenderPass`. Note: `OnRenderImage` and `Graphics.Blit` are incompatible with Unity 6's render graph.
