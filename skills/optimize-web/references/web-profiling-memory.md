# Profiling Web builds

| Tool | Use | Notes |
|---|---|---|
| **Chrome DevTools > Performance** | CPU flamegraph; main-thread analysis | Default first stop for WebGL hitches; inspect Wasm call stacks |
| **Chrome DevTools > Memory** | Heap snapshot; allocation timeline | Find JS/Wasm memory leaks; compare snapshots before/after scene load |
| **Firefox Profiler** | Cross-platform; shareable URLs; native + Wasm view | Better Wasm symbolication than Chrome in some cases; shareable profile URLs for team review |
| **Safari Web Inspector** | iOS Safari and macOS Safari debugging | Required for Safari-specific issues; WebGL/Wasm runtime differs from Chromium |
| **Unity Profiler over WebSocket** | Connect to a development build; standard markers | Use for Unity-side markers (GC, rendering, scripts); does not capture browser-side overhead |

**Symptom → tool quick reference:**

| Symptom | First-line tool | Second-line tool |
|---|---|---|
| WebGL hitch / stutter | Chrome DevTools > Performance | Firefox Profiler |
| Memory climbing over time | Chrome DevTools > Memory | Unity Memory Profiler (WebSocket) |
| Slow initial load | Chrome DevTools > Network | Build Report Inspector |
| Safari-only rendering issue | Safari Web Inspector | Compare with Chrome DevTools |

**Embedding profiling symbols** — browser profilers show mangled Wasm function names by default. To get readable C# method names in Chrome/Firefox flamegraphs, either enable `Player Settings > Publishing > Debug Symbols` for dev builds, or add a build processor:

```csharp
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;

public class WebProfilingBuildProcessor : IPreprocessBuildWithReport
{
    public int callbackOrder => 0;
    public void OnPreprocessBuild(BuildReport report)
    {
        PlayerSettings.SetAdditionalIl2CppArgs("--compiler-flags=--profiling-funcs");
    }
}
```

**Emscripten built-in profilers** — enable one at a time via `PlayerSettings.WebGL.emscriptenArgs`:

| Flag | What it shows |
|---|---|
| `--cpuprofiler` | CPU profiler overlay in browser |
| `--memoryprofiler` | Visual memory map (white=allocated unused, pink=stack, blue=dynamic, green=fragmented) |
| `--threadprofiler` | Thread activity profiler |

**GPU debugging** — No Frame Debugger support on Web. Use [Spector.js](https://spector.babylonjs.com/) as a browser-based alternative — it captures draw calls and WebGL state.

**Firefox `about:memory`** — type `about:memory` as a URL in Firefox, click Measure to see per-tab breakdown: WASM code size, WASM heap, .data file, web audio. Watch for WASM heap > 300 MB (crash risk, especially on iOS Safari).

Editor Play Mode does not represent browser runtime; always measure in browser. Chrome and Safari GC and JIT behavior differ — test both.

# Web memory directives

- Disable **Read/Write Enabled** on textures and meshes — it duplicates data into the WASM heap.
- Reduce `.data` file size by moving assets to Addressables or AssetBundles.
- Use compressed texture formats (KTX2/Basis) to reduce both download and decoded memory cost.

# iOS Safari memory limits

- **iOS < 18:** WebContent process limit ~1.5 GB. WASM memory (Gigacage) capped at 2 GB. Typed arrays share this pool. On iPhone X (iOS 16) heap growth caps at ~512 MB, but setting Initial Memory Size to 512 MB–1.5 GB upfront works.
- **iOS 18+:** Limits largely lifted; iPhone 11 can allocate ~4 GB.
- On iOS, set **Initial Memory Size** to the target peak rather than relying on growth — Safari handles large upfront allocations better than incremental growth.
- WASM heap > 300 MB risks crashes on older iOS; target < 200 MB for broad compatibility.

# Video and audio on Web

- **Video:** Playback only works from a URL (server with CORS enabled) or from StreamingAssets. On iOS the server must support HTTP range requests for streaming. Use browser-compatible formats (MP4/H.264).
- **Audio:** AudioEffects (mixer effects) require compute shaders — **not available on WebGL**. Mixers and MixerGroups work for volume control only. Set audio to **Mono** to improve loading. If `about:memory` shows web audio > 100 MB, audio is likely uncompressed — switch to Vorbis.

# Canvas and DPI

If the canvas is scaled up it takes the new resolution. Use `devicePixelRatio` in the web template to offset DPI scaling and avoid rendering at unnecessarily high resolution.
