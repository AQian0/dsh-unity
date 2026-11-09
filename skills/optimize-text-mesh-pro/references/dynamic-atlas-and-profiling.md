# Dynamic OS Atlas Population

If the user is shipping multilingual builds and concerned about build size, advise evaluating **`Atlas Population Mode = Dynamic OS`**. Read the Dynamic OS font asset section of [Font assets](https://docs.unity.com/en-us/engine/<VERSION>/manual/uitoolkits/uielements/uie-work-with-text/uie-font-asset/uie-font-asset.md) for what it changes in the build. The TMP package manual doesn't cover Dynamic OS, but this page covers the font assets that TMP and UI Toolkit share.

At runtime, Dynamic OS looks for a device font with the same Family and Style name as the source font, so choose a source font whose name exists on each target platform. Recommended system fonts for CJK:

| Platform | Recommended system font |
|---|---|
| **Android** | NotoSans (covers Chinese, Japanese, Korean glyphs broadly). |
| **iOS** | PingFang for Simplified/Traditional Chinese. iOS uses **unique fonts per language** for CJK (different families for Chinese, Japanese, Korean) - check the fallback chain when shipping a single TMP setup across all three. |

---

# Memory Profiler: Include Font Data

If Memory Profiler shows unexpectedly large font asset sizes, check **Include Font Data** on the `.ttf` / `.otf` import settings. Read [TrueTypeFontImporter.includeFontData](https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unityeditor/truetypefontimporter/includefontdata.md) for what it controls.

Keep it on for fonts that dynamic font assets use, because they generate glyphs from the font data at runtime. Don't turn it off just to make an Editor capture look like a device, because it changes what ships in the build. For build size, use static font assets or [Dynamic OS](#dynamic-os-atlas-population) instead.

---

# Worldspace vs Canvas Text

If the user has worldspace text (damage numbers, signs, holograms) using `TextMeshProUGUI`, advise switching to **`TextMeshPro`**. Worldspace Canvas is a known inefficiency.

If a `TextMeshProUGUI` element's `text` changes often (timers, counters, chat), advise **parenting it under a child GameObject with its own Canvas component**. Canvas rebuilds are scoped per-Canvas, so isolating the volatile field cuts rebuild cost on the rest of the UI.

---
