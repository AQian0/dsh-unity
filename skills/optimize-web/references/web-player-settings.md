# Player Settings audit

Verify and set these values through `script eval`:

| Setting | Release recommendation |
|---|---|
| **Compression Format** | **Brotli** (HTTPS hosting); Gzip for HTTP |
| **Decompression Fallback** | **Off** when server is correctly configured |
| **Strip Engine Code** | **On** |
| **Managed Stripping Level** | **High** (release) / Medium (dev) |
| **Code Optimization** | **Disk Size with LTO** (release) / Build Times (dev) |
| **WebAssembly Language Features** | **2023** if browser baseline allows |
| **Enable Exceptions** | **None** (smallest); Explicitly Thrown Only if `try/catch` required |
| **Initial Memory Size** | Tune to peak estimate; too small causes expensive growth |
| **Memory Growth Mode** | **Geometric** |
| **API Compatibility Level** | **.NET Standard 2.1** — smaller than .NET Framework |
| **IL2CPP Code Generation** | **Optimize Size** — smaller Wasm at slight runtime cost |
| **Debug Symbols** | **Off** for release; on for development builds only |
| **Data Caching** | **On** — caches asset data in browser IndexedDB for faster repeat loads |
| **Strip Unused Mesh Components** | **On** — removes unused vertex attributes |
| **Maximum Memory Size** | **2048 MB** default; up to 4096 for complex 3D (Firefox and Chrome < 119 have issues above 2048) |
| **vSyncCount** | 0 (browser handles pacing) |
| **targetFrameRate** | -1 (use `requestAnimationFrame`) |

# Compression and server configuration

| Compression | Use when | Notes |
|---|---|---|
| **Brotli** | HTTPS or localhost | Best ratio; browsers accept only over secure contexts |
| **Gzip** | HTTP delivery, legacy CDNs | Universal |
| **None** | Local dev / file:// | Largest payload; do not ship |

Configure the server to:
- Serve `.br` files with `Content-Encoding: br`.
- Serve `.gz` files with `Content-Encoding: gzip`.
- Set `Content-Type: application/wasm` for `.wasm`, `application/javascript` for `.js`.
- Enable HTTP/2 or HTTP/3 to parallelize chunk fetches.

If the host cannot inject `Content-Encoding`: set **Decompression Fallback = On** as a fallback only — it adds ~150 KB JS and slows startup.

# Exception handling

| Setting | Build size | Use |
|---|---|---|
| **None** | Smallest | Release builds where uncaught exceptions are acceptable |
| **Explicitly Thrown Only** | Modest | Default for projects that catch exceptions |
| **Full** | Largest, slowest | Rarely needed; avoid for release |

Wasm 2023 introduces a cheaper exception model; switching from Explicitly Thrown Only (legacy) to Wasm exceptions reduces both size and cost when browser targets support it.
