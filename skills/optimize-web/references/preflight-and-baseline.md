# Pre-flight checks and the current-state baseline

Detail behind the skill's `0. Pre-Flight` and `1. Assess Current State` steps. Read every value with
the Pre-Flight snippet in [Reading the settings this skill audits](editor-csharp.md#reading-the-settings-this-skill-audits).

# Pre-Flight checks

Confirm every one before configuring anything, and fix failures first.

1. **Confirm Web build target:** `EditorUserBuildSettings.activeBuildTarget` must be `WebGL`; if not, warn the user.
2. **Read compression and stripping settings:** Read `compressionFormat`, `decompressionFallback`, `stripEngineCode` and the managed stripping level with the Pre-Flight snippet. Note the stripping level is `PlayerSettings.GetManagedStrippingLevel(NamedBuildTarget.WebGL)` — there is no `PlayerSettings.managedStrippingLevel` property.
3. **Read exception and optimization settings:** Read `PlayerSettings.WebGL.exceptionSupport` from the Pre-Flight snippet. For the wasm code optimization level use `UnityEditor.WebGL.UserBuildSettings.codeOptimization` — the `PlayerSettings.WebGL.codeOptimization` and `optimizationLevel` spellings do not exist and will not compile.
4. **Read frame rate settings:** Read `Application.targetFrameRate` and `QualitySettings.vSyncCount`.
5. **Read additional player settings:** Read `PlayerSettings.WebGL.dataCaching`, `PlayerSettings.WebGL.debugSymbolMode`, `PlayerSettings.WebGL.maximumMemorySize`, and `PlayerSettings.GetApiCompatibilityLevel`.
6. Proceed only after you've confirmed the compression, stripping, frame rate, and player settings.

# Assess Current State

1. **Check Build Report:** Instruct the user to open `Window > General > Build Report` after a build and identify the largest asset and code size contributors.
2. **Verify server configuration:** Ask the user to confirm whether the hosting server sends `Content-Encoding: br` (Brotli) or `Content-Encoding: gzip` headers, and whether `Content-Type: application/wasm` is set for `.wasm` files.
3. **Check frame rate config:** Confirm, with the Pre-Flight snippet, `Application.targetFrameRate` — should be `-1` for Web (let the browser drive).
4. **Check memory settings:** Read `PlayerSettings.WebGL.initialMemorySize` and `PlayerSettings.WebGL.memoryGrowthMode`.
5. Report findings before making recommendations.
