# Glossary

Some names mean different things in the product, the UI and the API, so use these meanings:

- **TextMeshPro (TMP)**: the text system as a whole.
- **`TextMeshPro` component**: the 3D text component for text in the scene, without a Canvas.
- **`TextMeshProUGUI` component**: the UI text component that renders through a Canvas.
- **Dynamic** and **Dynamic OS**: two different Atlas Population Mode values. Dynamic uses the project's font file, and Dynamic OS uses a font on the device. Don't treat one as the other.

# Full topic map

The docs pages are local markdown conversions of the Unity Manual, stored at `<project-folder>/Library/PackageCache/com.unity.ugui@*/` (TMP pages in `Documentation~/TextMeshPro/`) or, for the older package, `<project-folder>/Library/PackageCache/com.unity.textmeshpro@*/` (TMP pages in `Documentation~/`). Read only the .md files in that specific `PackageCache` subfolder. You must not look at non-.md files, or look outside at other Library or PackageCache folders, otherwise it takes too much time.

If that folder has no .md files, because some packages don't ship their docs, use the online pages at `https://docs.unity3d.com/Packages/com.unity.ugui@<VERSION>/manual/TextMeshPro/<page>.html` or `https://docs.unity3d.com/Packages/com.unity.textmeshpro@<VERSION>/manual/<page>.html`, where `<page>` is the file name from the list below without `.md`. Use `.html`, because package docs on docs.unity3d.com don't publish a `.md` version of each page. Some older `com.unity.textmeshpro` versions publish only an index page; if a page is missing, use the `com.unity.ugui@2.0` page instead.

- **Text objects** — `TMPObjectUIText.md`: `TextMeshProUGUI` properties, including Auto Size and Material Preset
- **Font Assets** — `FontAssets.md`: overview of font assets, including Clear Dynamic Data on Build
  - Font Asset Properties — `FontAssetsProperties.md`: Scale, Atlas Population Mode, atlas size, font weights
  - Font Asset Creator — `FontAssetsCreator.md`: sampling point size, padding, render mode
  - Dynamic Fonts — `FontAssetsDynamicFonts.md`: how dynamic font assets add glyphs, and what they cost
  - Fallback Fonts — `FontAssetsFallback.md`: per-asset and global fallback chains
  - Line Metrics — `FontAssetsLineMetrics.md`: ascender, descender, baseline, for aligning mixed scripts
  - Signed Distance Fields — `FontAssetsSDF.md`: how SDF atlases render text
- **Sprites** — `Sprites.md`: creating Sprite Assets and the source texture settings
- **Shaders** — `Shaders.md`: TMP shaders and the material properties a preset overrides
- **Settings** — `Settings.md`: TMP Settings, default and global fallback fonts

## API reference

The API is the `TMPro` namespace (for example `TMP_FontAsset`, `TextMeshPro`, `TextMeshProUGUI`), part of the `com.unity.ugui` package (2.0 or later) or the older `com.unity.textmeshpro` package. It is versioned by package version, not Unity version (e.g. `@2.0`, `@3.0`), so check the project's installed package version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the installed package version, or read it from `Packages/packages-lock.json`.
2. Fetch and cache `https://docs.unity3d.com/Packages/<package-name>@<version>/xrefmap.yml` (replace `<package-name>` with `com.unity.ugui` or `com.unity.textmeshpro`, and `<version>` with the installed package version, e.g. `2.0`). This file maps every public API member's fully qualified name to its docs page `href` (e.g. `href: api/TMPro.TMP_FontAsset.html` => `https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/TMPro.TMP_FontAsset.html`).
3. Grep the yml file locally for a class or method instead of refetching per lookup. Don't read the whole file.

Always fetch the version matching the installed package rather than relying on training knowledge, since APIs are frequently marked obsolete between major versions.
