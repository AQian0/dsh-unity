---
name: optimize-text-mesh-pro
description: Optimizes TextMeshPro rendering, memory, and font setup, including font asset stacks, fallback atlases, SDF quality, and worldspace text. Use when the user asks about TextMeshPro font assets, CJK font fallbacks, or TMP memory, build size, quality or performance, not about translating text.
---

# Optimize TextMeshPro

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Don't use `using` directives or unqualified types in the `snippet` for `eval`. The compiler reads `using UnityEngine` and a bare `AssetDatabase`, `Volume`, or `Object` causes errors (CS0246 / CS0103 / CS0104). `return` what you want to read; it arrives at `data.result.result`.
- Never leave verification code in the user's script; never build logging or detection they didn't ask for. See [Final step](#final-step).
- Avoid long explanations.

First, read the Unity version from `ProjectSettings/ProjectVersion.txt` and the `com.unity.ugui` or `com.unity.textmeshpro` version from `Packages/packages-lock.json`, because the doc URLs and some advice depend on them.

Before you go forward with a workflow or diagnosis, read the [documentation page(s)](#full-topic-map) that cover the specific subject you intend to work on, check if you've missed anything, and name the file(s) you read in your response, because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

## Full topic map

Docs pages, API entry points, glossary and the doc URL version rules: [references/topic-map.md](references/topic-map.md).

## API reference

Read [API reference](references/topic-map.md#api-reference) before relying on a class or method name.

## Workflow

1. Read the Unity version and the `com.unity.ugui` or `com.unity.textmeshpro` version, as described above.
2. Read the doc pages that cover the area you'll work on.
3. Identify the symptom with the [Triage](#triage--identify-the-symptom-first) table, asking the user if they haven't described one.
4. Follow the matching section in [references/tuning-and-quality.md](references/tuning-and-quality.md) or [references/dynamic-atlas-and-profiling.md](references/dynamic-atlas-and-profiling.md). Give advice by default and change settings only when the user asks, because many of them change memory use or build size for the whole project; create a restore point before you change anything.
5. Run the [Final step](#final-step), then give the [Final report](#final-report).

## Triage — identify the symptom first

Before providing tips, identify which category the user's issue falls into. If they haven't described one, ask: "Are you seeing a **memory/atlas bloat**, **visual quality**, **CPU/performance**, **build size**, or **localization/alignment** issue with TextMeshPro?"

These three sections are in [references/dynamic-atlas-and-profiling.md](references/dynamic-atlas-and-profiling.md): Memory Profiler: Include Font Data, Dynamic OS Atlas Population, Worldspace vs Canvas Text. Every other section in the table is in [references/tuning-and-quality.md](references/tuning-and-quality.md).

| Symptom | Go To |
|---|---|
| Memory Profiler shows large or multiple TMP atlases | Font Stack & Dynamic Fallbacks, Memory Profiler: Include Font Data |
| Inconsistent glyph weight, fuzzy edges, visual quality | Padding & Sampling Ratios, Font Asset Scale, Atlas Render Mode: SDF16 |
| CPU spikes during text updates or Canvas rebuilds | AutoSize, Worldspace vs Canvas Text |
| Build size too large from shipped font files | Dynamic OS Atlas Population |
| Mixed Latin + CJK alignment looks off | Font Normalization |
| Need multiple font styles (italic, outline, glow) | Material Presets |
| Slow loading of TMP Sprite Assets on mobile | Sprite Assets |

---

## Core Rules

- **Main font = static asset with all glyphs baked in.** Add **dynamic** fallbacks to the font asset's own Fallback list for everything else, not the global list in TMP Settings, unless every font in the project should share them (see `FontAssetsFallback.md`). Keep dynamic atlas size at **512-1024** to bound peak memory.
- **Dynamic fallback fonts -> enable `Clear Dynamic Data On Build`.** Otherwise editor-baked glyphs ship in the player.
- **Keep Padding-to-Sampling-Point-Size ratio consistent across primary + fallback fonts.** Mismatch produces inconsistent glyph weight on the same line.
- **Latin sampling point size 70-90; CJK 36-50.** Different scripts need different sampling sizes for clean SDF.
- **Font asset Scale = 1.** Anything else (e.g., 0.9) breaks standard point-size math.
- **Disable AutoSize at runtime once layout is locked.** AutoSize is for design, not for live counters.
- **Worldspace text -> use `TextMeshPro`, not `TextMeshProUGUI`.** Canvas overhead in worldspace is not free.
- **Parent often-changing TMP UI to its own Canvas** to bound rebuild cost.
- **TMP material presets > duplicating font assets** for italic / bold / outline / glow variants of the same font.
- **For shipping multilingual builds on iOS/Android, evaluate `Atlas Population Mode = Dynamic OS`** to leverage system fonts and shrink the build.

---

## Final step

Do these checks:

1. Check the project has zero console errors. Use `console_status` for counts.
2. Stop there unless the user asked you to prove it works or you suspect a specific fault.
3. If you do enter Play mode, do it once only to chase a fault you already suspect. Read the world through `eval` rather than adding logging. Take no screenshots as they take too much time.

If a check fails, reread the [docs pages](#full-topic-map) to find what you missed.

If you changed settings, also read them back through the API, because an Inspector or script change can fail to save. For example: `TMP_FontAsset.atlasPopulationMode`, `m_ClearDynamicDataOnBuild` (through `SerializedObject`), the font asset's `faceInfo.scale`, `enableAutoSizing` on the text component, `TrueTypeFontImporter.includeFontData`, and `TextureImporter.textureType` for a sprite source texture. If a value doesn't match what you set, set it again and read it back.

If you changed settings to reduce memory or build size, compare a measurable result before and after, because a saved setting doesn't prove the problem is gone. For example, record each font asset's `TMP_FontAsset.atlasTextures` count and dimensions before and after your change. If the result didn't improve, reread the [docs pages](#full-topic-map), and say so in the final report rather than claiming a fix.

## Final report

Report the following, in this order:

1. The symptom category, and each setting you recommended or changed, with the current and recommended values.
2. The verification results from the final step, including the before and after measurements.
3. Any side effects of your changes, such as Examples & Extras assets you imported or other assets that use a font asset you changed.
4. Follow-up the user must do, such as testing Dynamic OS fonts on iOS and Android devices, or capturing a new Memory Profiler snapshot.
5. The doc pages you read.
