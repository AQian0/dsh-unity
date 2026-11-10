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
- Take your time and do this thoroughly; quality is more important than speed.

## Full topic map

Docs pages, API entry points, and the Unity tooling to point at beyond this audit: [topic-map.md](references/topic-map.md).

## Procedure

1. **Project context and docs.** Read the Unity version from `ProjectSettings/ProjectVersion.txt` and the package versions from `Packages/packages-lock.json`, apply the defaults in [understand-request.md](references/understand-request.md), and read the docs pages that cover the task from the [Full topic map](#full-topic-map). If the user hasn't said what to optimize, ask.
2. Set up `script eval` as in [Running C# in the Editor](#running-c-in-the-editor); without it, say so and mark build validation and runtime checks as unperformed.
3. Run [0. Pre-Flight](#0-pre-flight) and [1. Assess Current State](#1-assess-current-state) for your baseline, then match the request in [2. Understand Request](#2-understand-request).
4. Create a restore point, then apply the changes from [3. Web Build Optimization Workflow](#3-web-build-optimization-workflow), following [5. Troubleshooting](#5-troubleshooting) when a symptom matches one.
5. Run [4. Validation](#4-validation) against the baseline, do the checks in [Final step](#final-step), then give the [Final report](#final-report).

## Running C# in the Editor

[editor-csharp.md](references/editor-csharp.md) covers passing C# to `script eval`, reading the audited settings, applying them, and [why a read-back lies](references/editor-csharp.md#verify-from-disk-not-from-the-objects-you-just-wrote).

## 0. Pre-Flight

Read every value with the Pre-Flight snippet and confirm every check in [preflight-and-baseline.md](references/preflight-and-baseline.md#pre-flight-checks); the build target must be `WebGL`, or warn the user. These three spellings do not exist and will not compile: `PlayerSettings.managedStrippingLevel` (use `PlayerSettings.GetManagedStrippingLevel(NamedBuildTarget.WebGL)`) and `PlayerSettings.WebGL.codeOptimization` / `optimizationLevel` (use `UnityEditor.WebGL.UserBuildSettings.codeOptimization`). Proceed only after you've confirmed the compression, stripping, frame rate, and player settings.

## 1. Assess Current State

Record the Build Report's largest contributors, the server's `Content-Encoding` and `.wasm` MIME type, `Application.targetFrameRate` and the memory settings as your baseline, ; details in [preflight-and-baseline.md](references/preflight-and-baseline.md). Report findings first.

## 2. Understand Request

The questions that decide which optimizations are in scope: [understand-request.md](references/understand-request.md).

## 3. Web Build Optimization Workflow

### IMPORTANT: One-click optimization script

**Always offer to generate this script for the user.** Unity's official web optimization docs provide a single editor menu script that applies all recommended release settings at once. Place in `Assets/Editor/WebOptimizer.cs` — see [scripts/WebOptimizer.cs](scripts/WebOptimizer.cs) for the template, and adapt it to the project (keep exceptions if they use `try/catch`, switch Brotli to Gzip for HTTP hosting). It is the single most impactful action for a new web project: it prevents settings from being missed.

### References for the changes

- Settings, exception modes and server compression: [web-player-settings.md](references/web-player-settings.md) — **None** is the smallest exception mode, avoid **Full** for release.
- Resources, quality, frame rate, textures, streaming: [web-assets-quality.md](references/web-assets-quality.md).
- Profiling, memory, Safari limits, media, Canvas DPI: [web-profiling-memory.md](references/web-profiling-memory.md).

## 4. Validation

1. Re-read the Player Settings with the Pre-Flight snippet (compression, stripping, exceptions, targetFrameRate).
2. Rebuild the player and compare Build Report file sizes with baseline.
3. Verify in at least Chrome and Safari (GC and JIT behavior differ).
4. Max **3 iterations** before asking the user for feedback.

## 5. Troubleshooting

Symptom → cause → fix for the common Web build problems, including [local dev server setup](references/troubleshooting.md#local-dev-server-setup) before serving a build locally or testing Brotli over HTTPS: [troubleshooting.md](references/troubleshooting.md).

## Final step

Web settings only take effect in a browser build, so a clean compile and Play mode aren't enough. Run these checks in order; if one fails, reread the [docs pages](#full-topic-map) and rerun.

1. Check the project has zero console errors.
2. Check that each setting you changed is saved: `ProjectSettings/ProjectSettings.asset` holds the new values, and `codeOptimization` reads back through the API ([read why](references/editor-csharp.md#verify-from-disk-not-from-the-objects-you-just-wrote)).
3. If you rebuilt the player, serve it as in [local dev server setup](references/troubleshooting.md#local-dev-server-setup) and check in a browser: no console errors, and the Network tab returns the `Content-Encoding` header matching the compression format (`br`/`gzip`) with sizes that match the Build Report.
4. If the change affects runtime behaviour, read the `Debug.Log` lines in the browser console, then remove them; avoid screenshots unless necessary.

## Final report

Give the user a concise but not dense checklist of what you did:

- The download size before and after, and each setting you changed (compression, stripping, exceptions, `targetFrameRate`) with its old and new value.
- Any side effects, such as a script you added (for example `Assets/Editor/WebOptimizer.cs`), a quality level you changed, or a per-machine setting that doesn't travel to teammates or CI (`codeOptimization`).
- Any check you didn't run, such as a browser test without a rebuild, and the assumptions you made.

List follow-ups such as CDN setup for Addressables remote groups, Safari testing, or Wasm 2023 when the browser baseline allows. Worked example: [report-example.md](references/report-example.md).
