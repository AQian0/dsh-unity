# Critical V2 Architecture

| Context | Component | Purpose | Allowed Usage |
|---------|-----------|---------|---------------|
| **Editor Authoring** | `SpriteAtlasAsset` | Add/remove sprites/folders; store metadata | ✅ Editor scripts only |
| **Editor Settings** | `SpriteAtlasImporter` | Configure texture, packing, platform settings | ✅ Editor scripts only |
| **Editor Packing** | `SpriteAtlasUtility.PackAtlases()` | *Optional* editor preview packing (not for build) | ⚠ Only for preview; atlases auto-pack at build |
| **Runtime** | `SpriteAtlas` | Query packed sprites (read-only) | ✅ Runtime scripts only |
| **Runtime Loading** | `SpriteAtlasManager` | Dynamic loading callbacks | ✅ Runtime scripts only |

## Forbidden Cross-Context Usage (Common Error Sources)

| ❌ Invalid Pattern | ✅ Correct Pattern |
|--------------------|-------------------|
| `new SpriteAtlas()` in editor code | Use `SpriteAtlasAsset` + `SpriteAtlasImporter` |
| `AssetDatabase.LoadAssetAtPath<SpriteAtlas>(...)` in editor | Use `SpriteAtlasAsset.Load(...)` |
| `SpriteAtlasAsset.GetPackables()` in editor | Use `SpriteAtlas.GetPackables()` |
| Modifying `SpriteAtlas` in editor scripts | Modify `SpriteAtlasAsset` → reimport → use `SpriteAtlasImporter` |
| Create variants from original packable objects (sprites/folders) | Creating variants from a Master runtime `SpriteAtlas` |

**NEVER script against `SpriteAtlas` in editor code** — it is *only* for runtime use in V2 except for GetPackables.
