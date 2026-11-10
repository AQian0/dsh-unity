---
name: optimize-audio
description: Optimizes audio memory, CPU cost, and playback quality through import settings and mixer configuration. Use when asked to reduce audio memory or Audio Mixer CPU cost, change clip Load Types, sample rates or codecs, or force 3D audio to mono.
---
## Critical Rules

- Do not make changes before reporting findings to the user
- Follow steps in strict order; never jump ahead
- STOP at every `WAIT` checkpoint and await the user's response before continuing
- Quality is more important than speed: measure before and after every change
- Always verify results in a device build; Editor audio stats are indicative only

## 0. Set up the execution path

Every C# step below runs inside a live Editor through the Unity CLI. **The `unity-cli` skill owns
getting you there** — installing the CLI, confirming a connected Editor, adding the project's
`com.unity.pipeline` package, telling a genuinely absent Editor apart from one stuck in Safe Mode,
and discovering the Editor's command catalog. Follow it first; don't re-derive any of it here.

Two things it can't know for you:

- **You need `script eval` in particular**, not just a reachable Editor. Confirm it appears in the
  catalog. Its presence depends on the Pipeline package version, not on the CLI, so a healthy
  install can still lack it — if it's missing, say so and stop.
- **Do not hand-edit `.meta` files to change import settings.** Importer values only take effect
  through `SaveAndReimport()` in a live Editor, so an unreachable Editor is a stop, not a cue to
  edit metadata directly.

Run C# with `unity command script eval --caller plugin --skill optimize-audio --code '<snippet>'`. Discover the parameter shape from
`unity command --format json` rather than assuming one. `unity command` defaults to a 30 second
timeout.

### Passing C# to `script eval`

`script eval` compiles a **statement block, not a file**. Two consequences, both of which cause a compile
error rather than a warning:

- **No `using` directives.** The compiler reads `using UnityEngine;` as a resource-disposal
  statement and rejects it (`CS0210`).
- **Types must be fully qualified.** A bare `AssetDatabase` or `AudioImporter` does not resolve
  (`CS0246` / `CS0103`), and a bare `Object` is ambiguous with `object` (`CS0104`).

The recipes in [resources/audio-import-api.md](resources/audio-import-api.md) are written
fully qualified so they can be passed to `script eval` as-is.

## 1. Pre-Flight: Detect Audio System

Before doing anything else, establish the audio environment:

1. **Detect platform and sample rate:** Use `script eval` to read `EditorUserBuildSettings.activeBuildTarget` and `AudioSettings.outputSampleRate`. The output sample rate affects whether overriding clip sample rates will actually save memory.
2. **Detect AudioMixer presence:** Use the mixer-asset query recipe in [resources/audio-import-api.md](resources/audio-import-api.md) to see if a mixer graph exists. If none exists, note that routing and effect costs are not a concern.
3. **Detect AudioListener:** Use the scene-component query recipe in [resources/audio-import-api.md](resources/audio-import-api.md) for `UnityEngine.AudioListener` to confirm exactly one listener is present. Multiple listeners produce incorrect spatialization; zero listeners produce silence.
4. **Proceed** only after platform and listener state are confirmed.

## 2. Assess Current State

Before recommending any change, gather observable data:

1. **Find all AudioSources:** Use the scene-component query recipe in [resources/audio-import-api.md](resources/audio-import-api.md) for `UnityEngine.AudioSource`. For each result, use **one** `script eval` call to batch-read properties — see the batch read recipe in [resources/audio-import-api.md](resources/audio-import-api.md).
2. **Inspect mixer topology:** If a mixer was found in Pre-Flight, use `script eval` to read the AudioMixer's exposed parameters and group count. A group count above ~8 or effects on the Master group are immediate flags.
3. **Check DSP buffer size:** Use the DSP buffer recipe in [resources/audio-import-api.md](resources/audio-import-api.md) to read buffer size. See DSP Buffer Size Guidelines in [resources/platform-settings.md](resources/platform-settings.md) for recommended values.
4. **Report findings before making changes:** Summarize ALL detected sources, the listener count, and mixer depth to the user. Flag any immediate risks (e.g., stereo clip with `spatialBlend = 1`, Decompress On Load on a clip > 1 MB, reverb on the Master group).

**WAIT for the user to review the assessment before proceeding.**

## 3. Understand Request

Route to the correct section based on what the user needs:

| User Says | Path |
|-----------|------|
| "audio memory too high" / "memory profiler shows audio" | Section 4 — Import settings audit |
| "load times slow" / "decompression stall" | Section 4 — Load Type review |
| "DSP spike" / "mixer CPU" / "audio CPU high" | Section 4B — Mixer audit |
| "3D sound wrong" / "only left channel plays" / "stereo in 3D" | Section 4A — Force To Mono + spatial settings |
| "quality artifacts" / "voice sounds bad" / "Vorbis crackling" | Section 4C — Compression quality tuning |
| "mobile audio battery" / "mobile memory" | Section 4D — Mobile sample rate override |
| "set import settings on all clips" / "batch audio settings" | Section 4 — Bulk import audit |
| "streaming" / "background loading" / "Addressables audio" | Section 4E — Streaming and async load |

If the symptom is ambiguous, ask: "Is the problem audio memory usage, DSP CPU spikes, or audio playback quality?"

## 4. Primary Diagnostic Workflow

Use the findings from Section 2 to determine which sub-section applies. More than one may apply simultaneously.

## 4. Primary Diagnostic Workflow

Force-to-mono and spatial settings, the mixer audit, compression tuning, mobile sample-rate overrides, and load-type decisions: [references/diagnostics.md](references/diagnostics.md).
## 5. Validation

After any import setting or mixer change:

1. **Re-read clip stats:** Use `script eval` to re-read `clip.loadType`, `clip.channels`, `AudioSettings.outputSampleRate`, and the importer's `compressionFormat` to confirm the change applied after reimport.
2. **Confirm AudioSource routing:** Use the scene-component query recipe for `UnityEngine.AudioSource` and verify `audioSource.outputAudioMixerGroup` is assigned as expected after any mixer restructure.
3. **Report delta:** State the before and after values for each setting changed. Do not assume the change was effective without reading back the applied importer values.
4. **Iterate limit:** Maximum 3 adjust-and-verify cycles before pausing to ask the user for feedback.

## 6. Troubleshooting

Symptom → cause → fix for the audio problems this skill covers: [references/troubleshooting.md](references/troubleshooting.md).
## 7. Completion

Summarize every changed setting with before/after values, list clips or groups that still need
attention, and point the user at the Memory Profiler (runtime AudioClip memory) or the Unity
Profiler Audio module (DSP CPU) when those measurements are still open. The full checklist and the
related skills are in [completion.md](references/completion.md).
