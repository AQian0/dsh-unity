---
name: optimize-web
description: Optimizes Unity WebGL and WebGPU builds for smaller downloads, faster loading, and smoother browser performance. Use when asked to shrink a web build, speed up its load, or fix stutter, memory or battery problems in the browser.
---
Audit and apply the Player Settings, compression, stripping, and server setup that make a Unity Web build smaller and faster.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` skill for each step. Use `unity-pipeline` too when it is available.
- Before making changes, establish a baseline of the current behavior so you can tell whether a later result is actually caused by your change.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- If the changes affect runtime behavior, add `Debug.Log` lines that will prove the actual scene behaviour (not just your changes) is now working - you'll read these when you enter Play mode to validate later. For example, log a GameObject's Transform scale if your fix is meant to make sure it changes size.
- Avoid long explanations.

## Performance Notes
- Take your time to do this thoroughly.
- Quality is more important than speed.

## Full topic map

Documentation pages and API entry points for this skill: [references/topic-map.md](references/topic-map.md).

## Procedure

1. Get the project context: the Unity version from `ProjectSettings/ProjectVersion.txt`, and the versions of the packages you need (`com.unity.cloud.ktx`, `com.unity.addressables`, `com.unity.web.stripping-tool`) from `Packages/packages-lock.json`. If there's no project, assume Unity `6000.0`. For any package not listed in `packages-lock.json`, assume the latest version in that package's documentation. Preserve every version you do find — only default the values that are actually missing. Name each assumption in your report and carry on. If the user hasn't said what to optimize and there's no project to read, ask what they want to improve.
2. Read the docs pages that cover the task, from the [Full topic map](#full-topic-map).
3. Set up `script eval` as described in [Running C# in the Editor](#running-c-in-the-editor). If no Editor is reachable or `script eval` is missing, say so, skip to step 5, then go straight to step 9. Mark build validation and runtime checks as unperformed in your report, and base your recommendations on the user's request and the docs from step 2.
4. Run [0. Pre-Flight](#0-pre-flight) and [1. Assess Current State](#1-assess-current-state). Their results are your baseline.
5. Match the request to a row in [2. Understand Request](#2-understand-request).
6. Create a restore point, then apply the changes from [3. Web Build Optimization Workflow](#3-web-build-optimization-workflow). If a symptom matches [5. Troubleshooting](#5-troubleshooting), follow that entry.
7. Run [4. Validation](#4-validation): rerun the Pre-Flight snippet and compare the values with your baseline.
8. Do the checks in [Final step](#final-step).
9. Give the [Final report](#final-report).

## Running C# in the Editor

Passing C# to `script eval`, reading the audited settings, and applying them: [references/editor-csharp.md](references/editor-csharp.md).

### Verify from disk, not from the objects you just wrote

Read [Verify from disk](references/editor-csharp.md#verify-from-disk-not-from-the-objects-you-just-wrote) before believing a read-back: Player Settings stay in memory until something saves them.

## 0. Pre-Flight

1. **Confirm Web build target:** Read, with the Pre-Flight snippet above, `EditorUserBuildSettings.activeBuildTarget` — must be `WebGL`; if not, warn the user.
2. **Read compression and stripping settings:** Read `compressionFormat`, `decompressionFallback`, `stripEngineCode` and the managed stripping level with the Pre-Flight snippet above. Note the stripping level is `PlayerSettings.GetManagedStrippingLevel(NamedBuildTarget.WebGL)` — there is no `PlayerSettings.managedStrippingLevel` property.
3. **Read exception and optimization settings:** Read `PlayerSettings.WebGL.exceptionSupport` from the Pre-Flight snippet above. For the wasm code optimization level use `UnityEditor.WebGL.UserBuildSettings.codeOptimization` — the `PlayerSettings.WebGL.codeOptimization` and `optimizationLevel` spellings do not exist and will not compile.
4. **Read frame rate settings:** Read, with the Pre-Flight snippet above, `Application.targetFrameRate` and `QualitySettings.vSyncCount`.
5. **Read additional player settings:** Read, with the Pre-Flight snippet above, `PlayerSettings.WebGL.dataCaching`, `PlayerSettings.WebGL.debugSymbolMode`, `PlayerSettings.WebGL.maximumMemorySize`, and `PlayerSettings.GetApiCompatibilityLevel`.
6. Proceed only after you've confirmed the compression, stripping, frame rate, and player settings.

## 1. Assess Current State

1. **Check Build Report:** Instruct the user to open `Window > General > Build Report` after a build and identify the largest asset and code size contributors.
2. **Verify server configuration:** Ask the user to confirm whether the hosting server sends `Content-Encoding: br` (Brotli) or `Content-Encoding: gzip` headers, and whether `Content-Type: application/wasm` is set for `.wasm` files.
3. **Check frame rate config:** Confirm, with the Pre-Flight snippet above, `Application.targetFrameRate` — should be `-1` for Web (let the browser drive).
4. **Check memory settings:** Read, with the Pre-Flight snippet above, `PlayerSettings.WebGL.initialMemorySize` and `PlayerSettings.WebGL.memoryGrowthMode`.
5. Report findings before making recommendations.

## 2. Understand Request

The questions that decide which optimizations are in scope: [references/understand-request.md](references/understand-request.md).

## 3. Web Build Optimization Workflow

### IMPORTANT: One-click optimization script

**Always offer to generate this script for the user.** Unity's official web optimization docs provide a single editor menu script that applies all recommended release settings at once. Place in `Assets/Editor/WebOptimizer.cs` — see [scripts/WebOptimizer.cs](scripts/WebOptimizer.cs) for the template.

Adapt the script to the user's project needs (e.g. keep exceptions if they use `try/catch`, switch Brotli to Gzip for HTTP hosting). This script is the single most impactful action for a new web project — it prevents settings from being missed.

### Player Settings, compression, and server configuration

Player Settings values, exception handling, and server compression setup: [references/web-player-settings.md](references/web-player-settings.md).

### Exception handling

| Setting | Build size | Use |
|---|---|---|
| **None** | Smallest | Release builds where uncaught exceptions are acceptable |
| **Explicitly Thrown Only** | Modest | Default for projects that catch exceptions |
| **Full** | Largest, slowest | Rarely needed; avoid for release |

Wasm 2023 introduces a cheaper exception model; switching from Explicitly Thrown Only (legacy) to Wasm exceptions reduces both size and cost when browser targets support it.

### Resources, quality, frame rate, textures, streaming

Unused-resource stripping, Web quality levels, frame rate, KTX/Basis textures, and streaming: [references/web-assets-quality.md](references/web-assets-quality.md).

### Profiling, memory, and device limits

Profiling a Web build, memory directives, iOS Safari limits, video and audio, and Canvas DPI: [references/web-profiling-memory.md](references/web-profiling-memory.md).

## 4. Validation

1. Re-read the Player Settings with the Pre-Flight snippet (compression, stripping, exceptions, targetFrameRate).
2. Rebuild the player and compare Build Report file sizes with baseline.
3. Verify in at least Chrome and Safari (GC and JIT behavior differ).
4. Max **3 iterations** before asking the user for feedback.

## 5. Troubleshooting

Symptom → cause → fix for the common Web build problems: [references/troubleshooting.md](references/troubleshooting.md).

### Local dev server setup

Read [Local dev server setup](references/troubleshooting.md#local-dev-server-setup) before serving a build locally or testing Brotli over HTTPS.

## Final step

Web settings only take effect in a browser build, so a clean compile and Play mode in the Editor aren't enough. Run these checks in order. If any check fails, reread the [docs pages](#full-topic-map) to find out what you missed, fix it, and run the checks again.

1. Check the project has zero console errors.
2. Check that each setting you changed is saved, as described in [Verify from disk](#verify-from-disk-not-from-the-objects-you-just-wrote): `ProjectSettings/ProjectSettings.asset` holds the new values, and `codeOptimization` reads back through the API.
3. If you rebuilt the player, serve the build as described in [Local dev server setup](#local-dev-server-setup) and open it in a browser. Then check the following:
   - The browser console shows no errors, such as a failed decompression or an out-of-memory error.
   - In the Network tab, the `.wasm`, `.data` and `.framework.js` files return the `Content-Encoding` header that matches the compression format (`br` for Brotli, `gzip` for Gzip), and their sizes match the Build Report.
4. If the change affects runtime behaviour, such as the frame rate or quality level, check the `Debug.Log` lines in the browser console, then remove them. Try to avoid taking and checking screenshots unless absolutely necessary, as they take more time.

## Final report

Give the user a concise but not dense checklist of what you did and why. Include the following:

- The download size before and after, and each setting you changed (compression, stripping, exceptions, `targetFrameRate`), with its old and new value.
- Any side effects, such as a script you added to the project (for example `Assets/Editor/WebOptimizer.cs`), a quality level you changed, or a setting that's stored per machine and doesn't travel to teammates or CI (`codeOptimization`).
- Any check you didn't run, such as a browser test without a rebuild, or every check when no Editor was available, and the assumptions you made.

If the user needs to follow up with more steps or decisions, list them, such as CDN setup for Addressables remote groups, Safari testing, or moving to the Wasm 2023 feature set when their browser baseline allows. For example:

```
I made the following changes:

[✓] Set Compression Format to Brotli and Strip Engine Code to on, because the server sends `Content-Encoding: br` over HTTPS.
[✓] Added `Assets/Editor/WebOptimizer.cs`, which applies the release settings from Tools > Apply Web Release Settings.

Follow these steps to finish:

1. Apply `codeOptimization` in your CI build step, because it's stored in `Library/` and doesn't travel with the project.
2. Test the build in Safari, because its garbage collection and JIT behaviour differ from Chrome.
```

## See also

Point the user at this Unity tooling when the task goes beyond this skill:

- **Addressables package** — remote groups served over a CDN, when the download budget needs content
  moved out of the initial payload.
- **Unity Profiler, connected to the browser** — the cross-platform profiling methodology. Section 3
  covers the Web-specific part of attaching it.
- **Shader variant stripping** (Graphics settings → Shader Stripping, and `ShaderVariantCollection`)
  — variant count feeds directly into Wasm size, so it is worth checking when stripping alone hasn't
  moved the number.
- **Project Settings → Player** — the same flags this skill reads, if the user would rather see them
  in the inspector than have them reported.
- Mobile browser battery behaviour follows the same frame-rate and quality-level guidance in
  Sections 3 and 4; there is no separate mobile path here.
