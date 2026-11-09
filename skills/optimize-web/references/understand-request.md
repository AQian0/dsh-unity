# 2. Understand Request

| User Says | Default Interpretation |
|-----------|----------------------|
| "build too large" / "download too slow" | Strip Engine Code on; Managed Stripping High; Disk Size + LTO; Brotli |
| "Decompression Fallback" / "slow startup" | Decompression Fallback off; fix server to send Content-Encoding |
| "stutter in Chrome" / "stutter in Safari" | Profile in browser DevTools; Safari caps at 60 fps |
| "excessive battery in browser" | `OnDemandRendering` on static screens; `targetFrameRate = -1` |
| "exceptions too large" | None for release; Wasm 2023 exceptions if browser baseline allows |
| "set up CDN" | Addressables remote groups + Brotli/Gzip on CDN |
| "WebAssembly 2023" | Enable when browser baseline supports it — smaller and faster |
| "memory growth slow" | Tune Initial Memory Size to peak estimate; use Geometric growth mode |
| "KTX" / "Basis Universal" / "texture formats unknown GPU" | KTX2 with Basis Universal; ETC1S for size, UASTC for quality |
| "strip unused code" / "remove unused packages" | Web Stripping Tool + remove unused packages + shader stripping |
| "quality settings for web" | Quality Level to Very Low or Low; lower quality = faster load |
| "shader variants too many" | Graphics settings: auto lightmap/fog modes; strip instancing + BRG variants; audit Always Included Shaders |
| "video not playing" / "audio issues" | Video: URL-only or StreamingAssets; Audio: no AudioEffects on Web, use Mono, compress |
| "profiler symbols" / "can't read Wasm stacks" | Embed profiling symbols via build processor or emscriptenArgs |
| "iOS crashes" / "Safari memory" | iOS memory limits; set Initial Memory Size high rather than growing; Gigacage 2GB limit pre-iOS 18 |
