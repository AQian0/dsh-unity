# 1. Delivery Mechanism (REQUIRED)

Ask: "How do you want to deliver the sprite atlases?"

**Option A: Built-in Data (Immediate Loading)**
- Atlases are included in the build and loaded immediately
- Set `includeInBuild = true`
- **Suitable for**: Core UI, main gameplay sprites, always-needed assets
- **Pros**: Simple, no additional packages, instant access
- **Cons**: Increases initial build size, cannot update without new build

**Option B: Late-Binding via Addressables (On-Demand Loading)**
- Atlases are NOT included in build, loaded on-demand via Addressables
- Set `includeInBuild = false`
- Create Addressables entries for each atlas
- Add addressable setup as prebuild step
- **🚨 REQUIRED**: Build Addressables content as build step
- **🚨 REQUIRED**: Create late-binding runtime loader script
- **Suitable for**: DLC content, optional features, large assets, downloadable content
- **Pros**: Smaller initial build, can update independently, on-demand loading
- **Cons**: Requires Addressables package, async loading, network dependency

| Use Case | Recommended |
|----------|-------------|
| Core UI sprites that are always visible | **Option A: Built-in** |
| Tutorial or onboarding sprites | **Option A: Built-in** |
| Level-specific sprites (100+ levels) | **Option B: Addressables** |
| DLC or seasonal content | **Option B: Addressables** |
| Localized UI sprites (multiple languages) | **Option B: Addressables** |
| Character skins or cosmetics | **Option B: Addressables** |
