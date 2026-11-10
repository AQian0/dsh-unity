# Font quality and performance tuning

The symptom sections behind the skill's triage table. Read the one that matches the symptom; each is
advice to give by default, and a setting to change only when the user asks.

# Font Stack & Dynamic Fallbacks

If the user reports memory bloat from TMP atlases, advise this font stack pattern:

```
Main font asset (static, all required Latin glyphs baked)
  -> Fallback 1: Dynamic font (atlas 512 or 1024) for CJK
  -> Fallback 2: Dynamic font for symbols / emoji
```

Don't use one dynamic font asset for every language, because its atlas keeps growing with every glyph the game uses. Check `Clear Dynamic Data On Build` on each dynamic fallback, as the Core Rules say (see `FontAssets.md`).

---

# Padding & Sampling Ratios

If the user reports inconsistent stroke widths or glyph weight differences between primary and fallback fonts, check the padding-to-sampling-point-size ratio.

The ratio is `Padding / SamplingPointSize`. With Padding = 9 and Sampling Point Size = 90, ratio = **10%**.

- A primary font with one ratio and a fallback with a different ratio produces **inconsistent stroke widths** on the same line.
- Pick a ratio (10% is a safe default), apply it to all font assets in the chain.

Recommended sampling point sizes:

- **Latin scripts**: 70-90.
- **CJK scripts**: 36-50 (CJK glyphs are visually denser; smaller sampling sizes still produce clean SDF and save atlas memory).

---

# Font Asset Scale

If the user reports point sizes not matching design specs, check the font asset Scale value. Some imported TMP font assets ship with `Scale = 0.9` instead of `1.0`. A non-1 Scale changes every rendered point size (see `FontAssetsProperties.md`). Advise the user to **set Scale = 1 on all font assets before adjusting padding ratios**.

---

# Sprite Assets

For the source texture settings a Sprite Asset needs, read `Sprites.md` (see the [Full topic map](topic-map.md)). If the user reports slow loading times for TMP Sprite Assets on mobile, check the source texture's Texture Type, and suggest setting it back to **Default** once the Sprite Asset is created, because Sprite type keeps child sprite sub-objects that TMP doesn't use.

---

# AutoSize

If the user reports CPU spikes on text fields that change frequently (timers, counters, chat, dynamic player names), check whether `enableAutoSizing` is on. AutoSize resizes the text whenever the string changes, causing constant CPU spikes.

Advise: **disable AutoSize and hard-code the chosen point size** once layout is locked. Keep AutoSize on only for genuinely static labels that auto-fit on locale change.

---

# Atlas Render Mode: SDF16

If a static font with point size **72 or larger** looks unclear or has fuzzy edges, advise switching the **Atlas Render Mode** to **SDF16**. Higher precision SDF for big glyphs, at slightly more atlas memory.

---

# Font Normalization

If the user reports misaligned Latin + CJK text on the same line, compare the line metrics of the primary and fallback font assets, and advise adjusting the fallback's ascender and descender until they match the primary's. Read `FontAssetsLineMetrics.md` (see the [Full topic map](topic-map.md)) for what each metric controls.

To show the lines in the scene, the `TMP_TextInfoDebugTool` component from TMP Examples & Extras draws them. Ask the user before importing Examples & Extras, because it adds unrelated example assets to the project.

---

# Material Presets

If the user needs multiple styles (italic, bold, outline, glow) of the same font, advise material presets instead of duplicating font assets. Presets share the same font texture but override shader parameters. For the Material Preset property on the text component, read `TMPObjectUIText.md`, and for the shader settings a preset can override, read `Shaders.md` (see the [Full topic map](topic-map.md)).
