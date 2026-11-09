# Key Requirements (V2-Specific)

1. **🚨 ALWAYS check for existing scripts FIRST**: Before generating code, scan for scripts with `[UNITY-SKILL:SPRITEATLAS]` identifier and prompt user to update or create new
2. **🚨 ALWAYS tag generated scripts**: Include skill identifier at the top of every generated script for future detection
3. **🚨 ALWAYS ask for delivery mechanism**: Ask user "Built-in data or Addressables?" before generating code
4. **🚨 ALWAYS enable Sprite Packer mode**: Set `EditorSettings.spritePackerMode = SpritePackerMode.SpriteAtlasV2` in prebuild script
5. **🚨 ALWAYS use prebuild generation**: Implement `IPreprocessBuildWithReport` as the DEFAULT approach for creating atlases
6. **🚨 ONLY add sprites from Assets/ folder**: Never add sprites from Packages, built-in assets, or external locations
7. **🚨 For Addressables delivery, ALWAYS generate THREE scripts**:
   - Prebuild atlas generator with Addressables setup
   - `IPostprocessBuildWithReport` to build Addressables content
   - Late-binding runtime loader script (extends `SpriteAtlasManager`)
8. **Set includeInBuild correctly**: `true` for built-in data, `false` for Addressables
9. **Two-Step Editor Pattern**: Create with `SpriteAtlasAsset` → Save → Import → Configure via `SpriteAtlasImporter` → SaveAndReimport()
10. **Never use `SpriteAtlas` in editor code** — except `SpriteAtlas.GetPackables()` instance method on a loaded runtime atlas
11. **Variants reference master**: Use `SetMasterAtlas(SpriteAtlas)` with runtime instance loaded via `AssetDatabase.LoadAssetAtPath<SpriteAtlas>()`
12. **Platform format assignment**: Use `format = TextureImporterFormat.ASTC_6x6` directly (no cast)
13. **File extension**: V2 atlases use `.spriteatlasv2` (not `.spriteatlas`)
14. **`SpriteAtlasUtility.PackAtlases()` is optional**: Only for editor preview; build-time packing is automatic

For common errors and invalid patterns, see [references/common-errors.md](common-errors.md).
