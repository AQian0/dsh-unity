# Docs topic map and API lookup

> Reference for the `create-tile-palette-or-rule-tiles` skill. The body's docs-first rule says to
> read the page that covers the subject before a workflow or diagnosis; this file says where every
> page lives, how `<VERSION>` resolves, and how to turn a package or Engine API into its page.

## Full topic map

Engine Manual pages: if the Editor install folder has a `Data/Documentation` folder (eg `.../Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), read the html files from the `en/Manual` folder. Otherwise the docs pages are online at `https://docs.unity.com/en-us/engine/<VERSION>/manual/unity2d/tilemaps.md`.

- **Create a tile palette** — local `en/Manual/tilemaps/tiles-for-tilemaps/create-tile-assets.html`, online `https://docs.unity.com/en-us/engine/<VERSION>/manual/unity2d/tilemaps/create-tile-palette/assets.md` — the palette asset, its settings sub-asset, and adding tiles.
- **Tile Palette window reference** — local `en/Manual/tilemaps/tile-palettes/tile-palette-editor-reference.html`, online `https://docs.unity.com/en-us/engine/<VERSION>/manual/unity2d/tilemaps/create-tile-palette/tile-palette-editor-reference.md` — Cell Size, Sort Mode and Sort Axis settings.

Package manual pages: the docs pages are local markdown conversions of the Unity Manual, stored at `<project-folder>/Library/PackageCache/com.unity.2d.tilemap.extras@*/`. Read only the .md files in that specific `PackageCache` subfolder. You must not look at non-.md files, or look outside at other Library or PackageCache folders, otherwise it takes too much time. If that folder has no `.md` files, use the online pages at `https://docs.unity3d.com/Packages/com.unity.2d.tilemap.extras@<VERSION>/manual/`, because some packages don't ship their docs.

- **Rule Tile** — `Documentation~/RuleTile.md` — how Rule Tiles match neighbours, rule order, and the Default Sprite.

### API reference

The APIs are `UnityEditor.Tilemaps` (`GridPaletteUtility`) in the `com.unity.2d.tilemap` package, `RuleTile`, `HexagonalRuleTile` and `IsometricRuleTile` in the `com.unity.2d.tilemap.extras` package, and `AssetDatabase` in the Unity Engine. Package APIs are versioned by package version and Engine APIs by Unity version, so check both before relying on a specific class or method, because APIs are frequently marked obsolete between versions.

1. Use the `unity-cli` skill to check the project's Unity version and installed package versions.
2. For package APIs, fetch and cache `https://docs.unity3d.com/Packages/<package-name>@<version>/xrefmap.yml` (eg `com.unity.2d.tilemap.extras@6.0`). It maps each public member's fully qualified name to its docs page `href` (eg `href: api/UnityEngine.RuleTile.TilingRule.html` => `https://docs.unity3d.com/Packages/com.unity.2d.tilemap.extras@6.0/api/UnityEngine.RuleTile.TilingRule.html`). Grep it locally instead of refetching per lookup; don't read the whole file. Start with `GridPaletteUtility.CreateNewPalette`, `RuleTile.TilingRule` (`m_Neighbors`, `m_NeighborPositions`, `m_RuleTransform`) and `RuleTile.TilingRuleOutput.Neighbor` (`This`, `NotThis`).
3. For Engine APIs, if the Editor install folder has a `Data/Documentation` folder, grep the html files in its `en/ScriptReference` folder and skip the rest of this step. Otherwise fetch and cache `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/xrefmap.yml` (about 6 MB, so grep it, don't read it) and convert the `uid` to a markdown page: remove the parameters in brackets, lowercase it, replace `.` with `/`, add `.md`, and fetch `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/<converted uid>`. For example, `UnityEditor.AssetDatabase.LoadAllAssetsAtPath(System.String)` => `https://docs.unity.com/en-us/engine/6000.3/script-reference/unityeditor/assetdatabase/loadallassetsatpath.md`. If that page doesn't exist, use the entry's `href` under `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/`.

## `<VERSION>` substitution

Replace `<VERSION>` with the following before fetching:

- **docs.unity3d.com**: The Unity version, eg `6000.6`
- **Package on docs.unity3d.com**: The package version, eg `@6.6` or `@2.0`. Check the package version if unsure.
- **Engine on docs.unity.com**: The Unity version, eg `6000.3`

Read the Unity version from `ProjectSettings/ProjectVersion.txt`. For package docs, use the package's major.minor from `Packages/packages-lock.json`, eg `1.0` for `com.unity.2d.tilemap` or `6.0` for `com.unity.2d.tilemap.extras`.
