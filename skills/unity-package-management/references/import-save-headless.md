# Import & save headlessly (generate `.meta` files)

> Reference for the `unity-package-management` skill. Read it when a script or tool has written new
> `.cs`/asset files outside the Editor and the project must import them without a window.

After a script or tool writes new `.cs`/asset files, Unity must **import** them so it generates
the `.meta` file each asset needs — and every `.cs`/asset MUST be committed together with its
`.meta`. Merely opening the project once (`unity open "<project-path>"`) imports and generates
them; use this method when you need it **headless** (in a script or CI).

Unlike the package installer, this is **synchronous** — it finishes before returning — so it's
safe to run via `unity run` (its injected `-quit` is harmless; the method also calls
`EditorApplication.Exit` for a clean exit code). Write
`Assets/Editor/ProjectBootstrap/ProjectSaver.cs`:

```csharp
using UnityEditor;
using UnityEngine;

namespace ProjectBootstrap
{
    public static class ProjectSaver
    {
        // Invoke with: -executeMethod ProjectBootstrap.ProjectSaver.SaveAll
        public static void SaveAll()
        {
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            AssetDatabase.SaveAssets();
            Debug.Log("[ProjectSaver] Assets imported and saved.");
            EditorApplication.Exit(0);
        }
    }
}
```

```bash
unity run "<project-path>" --editor-version <version> \
  -- -executeMethod ProjectBootstrap.ProjectSaver.SaveAll
```
