# Complete Workflow

```
User Request
    ↓
Step 0: Check for existing scripts with [UNITY-SKILL:SPRITEATLAS] identifier
    ↓
    ├─ Found existing scripts?
    │   ↓ YES
    │   Ask user: Update existing / Create new / Abort
    │   ↓
    │   Handle user choice
    │
    └─ NO existing scripts or user chose "Create new"
        ↓
        Ask "Built-in data or Addressables?"
        ↓
        ├─ Option A: Built-in
        │   ↓
        │   Generate 1 script: Prebuild generator (includeInBuild=true)
        │
        └─ Option B: Addressables
            ↓
            Generate 3 scripts:
              1. Prebuild: Generate atlases + create Addressables entries (includeInBuild=false)
              2. Postprocess: Build Addressables bundles
              3. Runtime: Late-binding loader component
```

**Step 3: Customize Categorization Rules**

Edit the `OnPreprocessBuild` method to match your project's sprite organization. Choose one or combine multiple strategies:

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| **Folder-based** | Sprites organized by folder structure | `GenerateAtlasByFolder("Assets/Art/UI", "Assets/Atlases/UI.spriteatlasv2")` |
| **Naming convention** | Sprites follow naming patterns | `GenerateAtlasByNaming("Assets/Art", "icon_", "Assets/Atlases/Icons.spriteatlasv2")` |
| **Asset labels** | Sprites tagged with labels |
| **Scene-based** | Sprites used in specific scenes | Query scene references |

**Step 4: Build Your Project**

Atlases are automatically generated/updated during build. **No manual menu clicks required.** This is why prebuild is the default approach.

**For Built-in Data (Option A):**
- Atlases are included in build
- Ready for immediate use at runtime

**For Addressables (Option B) - Additional Required Steps:**

You MUST generate THREE scripts (not just one):

1. **Prebuild script** (IPreprocessBuildWithReport) - Generates atlases and creates Addressables entries automatically
2. **Build Addressables script** (IPostprocessBuildWithReport) - Builds Addressables content bundles
3. **Late-binding runtime loader** (MonoBehaviour) - Handles on-demand loading via SpriteAtlasManager

The build process will:
- Generate atlases (prebuild step)
- Create addressable entries automatically
- Build addressables content bundles (postprocess step)
- At runtime: Late-binding loader automatically loads atlases when sprites are first accessed
