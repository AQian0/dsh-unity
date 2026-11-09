# Remove unused resources

Three categories to audit for build size reduction:

**1. Unused packages** — Check `Packages/manifest.json` and the Package Manager **In Project** and **Built-in** views. Remove or disable packages the project does not use. The Input System package is a significant size contributor if unused.

**2. Shader stripping** — Configure in `Edit > Project Settings > Graphics`:

| Setting | Recommendation |
|---|---|
| **Lightmap Modes** | Automatic (strips unused lightmap shader variants) |
| **Fog Modes** | Automatic (strips unused fog shader variants) |
| **Instancing Variants** | Strip Unused |
| **Batch Renderer Group Variants** | Strip All (if BRGs are not used) |
| **Always Included Shaders** | Audit and remove any shaders the project does not reference |

Test after stripping — make sure you didn't remove any referenced shaders.

**3. Web Stripping Tool** (`com.unity.web.stripping-tool`) — Analyzes the WebAssembly binary and identifies unused Unity engine submodules (e.g. 3D graphics in a 2D-only game). Install via Package Manager, profile the build, then configure which submodules to exclude. Can yield substantial size reductions beyond what Managed Stripping Level achieves alone.

# Quality settings for Web

Lower quality levels reduce load time and improve runtime performance. Set via `Edit > Project Settings > Quality`:

- Use **Very Low** or **Low** as the default Web quality level.
- Set it with `script eval`: `UnityEngine.QualitySettings.SetQualityLevel(0, true);` where 0 = Very Low.
- Consider creating a Web-specific quality level that disables features unnecessary in-browser (real-time shadows, post-processing effects, high particle counts).

# Frame rate on Web

- Set it with `script eval`: `UnityEngine.Application.targetFrameRate = -1;` — let the browser use `requestAnimationFrame`.
- Note: **Safari caps at 60 fps** in WebGL; high-refresh targets do not apply.
- Use `OnDemandRendering.renderFrameInterval` to drop to 5–10 fps on static/idle screens to save battery.

# KTX / Basis Universal textures

KTX2 with Basis Universal supercompression ships a single texture file that transcodes at load time to the optimal GPU format for the browser's device (BC7 on desktop, ASTC on mobile, ETC2 on older Android). This avoids shipping separate texture variants for each GPU family — critical for Web where the target hardware is unknown.

| Topic | Guidance |
|---|---|
| **Package** | Install `com.unity.cloud.ktx` (KtxUnity) via Package Manager |
| **When to use** | Runtime-loaded textures via Addressables or asset bundles served to unknown GPU targets |
| **When NOT to use** | Textures baked into the player build — Unity already selects the correct format at build time |
| **Supercompression** | Use **ETC1S** for smallest size (lossy, good for diffuse/albedo); **UASTC** for higher quality (near-lossless, better for normals/UI) |
| **Encoding** | Encode offline with `toktx` or `basisu` CLI; do not encode at runtime |
| **Linear data** | Set `--assign_oetf linear` when encoding normal maps, masks, or data textures to avoid incorrect sRGB conversion |
| **Mip maps** | Generate mips at encode time (`--genmipmap`) — browser-side mip generation is expensive |
| **Loading** | Use `KtxTexture.LoadFromStreamingAssets` or load bytes via UnityWebRequest and call `KtxTexture.LoadFromBytes` |
| **Memory** | Transcoded textures are standard GPU textures; memory cost equals the target format, not the KTX2 file size |
| **Orientation** | Always include `--lower_left_maps_to_s0t0` to match Unity's UV convention |

**`toktx` CLI examples:** See [scripts/toktx-examples.sh](../scripts/toktx-examples.sh) for commands covering albedo (ETC1S), normals/detail (UASTC), ICC profile errors, and linear data.

# Streaming on Web

- Use Addressables with **remote groups** hosted on a CDN with Brotli / Gzip.
- Avoid bundling the entire game into the initial download; stream levels on demand.
- Target < 30 MB initial download for "instant play"; level data follows.
- For streamed textures targeting mixed GPU hardware, prefer KTX2 bundles over per-platform variants — one bundle serves all browsers.
