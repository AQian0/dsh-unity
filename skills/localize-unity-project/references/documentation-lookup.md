# Full topic map

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

The docs pages are local markdown conversions of the Unity Manual, stored at `<project-folder>/Library/PackageCache/com.unity.localization@*/`. When reading docs, read only the .md files in that subfolder and don't browse other Library or PackageCache folders, because that takes too much time. This limit doesn't apply to package lookups that other steps run, such as the TMP import in [references/cjk-fonts.md](cjk-fonts.md). If that folder has no `.md` files, use the online pages at `https://docs.unity3d.com/Packages/com.unity.localization@<VERSION>/manual/` instead, because some package versions don't ship their docs.

Prefer `WebFetch` over `WebSearch` — faster and lands on the exact reference. Only fetch what you need. Replace `<VERSION>` with the following before fetching:

- **Package on docs.unity3d.com**: The package version, eg `@6.6` or `@2.0`. Check the package version if unsure.
- **docs.unity.com**: The product version, eg `7000.0`

Read the Unity version from `ProjectSettings/ProjectVersion.txt`, and each package's major.minor from `Packages/packages-lock.json` (for example `1.5` for `com.unity.localization`). TextMesh Pro (TMP) API pages are in the `com.unity.ugui` docs. If `packages-lock.json` lists `com.unity.textmeshpro` instead, use `https://docs.unity3d.com/Packages/com.unity.textmeshpro@<VERSION>/api/` with that package's version.

Read [references/docs-map.md](docs-map.md) for the manual, API and Script Reference pages to read.

# API reference

The API is `UnityEngine.Localization` and `UnityEditor.Localization`, part of the `com.unity.localization` package. It is versioned by package version, not Unity version (e.g. `@1.4`, `@1.5`), so check the project's installed package version before relying on a specific class or method.

1. Read the installed package version from `Packages/packages-lock.json`, as in [Step 1](../SKILL.md#1-check-the-localization-package-is-installed).
2. Fetch and cache `https://docs.unity3d.com/Packages/com.unity.localization@<version>/xrefmap.yml` (replace `<version>` with the installed package version, e.g. `1.5`). This file maps every public API member's fully qualified name to its docs page `href` (e.g. `href: api/UnityEngine.Localization.LocalizedTmpFont.html` => `https://docs.unity3d.com/Packages/com.unity.localization@1.5/api/UnityEngine.Localization.LocalizedTmpFont.html`).
3. Grep the yml file locally for a class or method instead of refetching per lookup. Don't read the whole file.

Always fetch the version matching the installed package rather than relying on training knowledge, since APIs are frequently marked obsolete between major versions. The same steps work for the TMP (`com.unity.ugui` or `com.unity.textmeshpro`) and `com.unity.addressables` APIs.

For Engine APIs (`UnityEditor.AssetDatabase`, `UnityEditor.PackageManager`, `UnityEngine.Events`), follow the Engine API lookup steps in [references/docs-map.md](docs-map.md).

For Asset Table entry, `Resources/` folder and font repair pitfalls, see [references/api-notes.md](api-notes.md).
