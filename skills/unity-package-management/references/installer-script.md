# The installer script

Write this to `Assets/Editor/ProjectBootstrap/PackageInstaller.cs`. It must live under an
`Editor/` folder (or an Editor-only assembly) because it uses `UnityEditor`.

```csharp
using System.Linq;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEditor.PackageManager.Requests;
using UnityEngine;

namespace ProjectBootstrap
{
    // Installs (and optionally removes) a fixed set of packages via the PackageManager
    // Client API, headless-safe.
    public static class PackageInstaller
    {
        // EDIT this list to match the package selection (see references/select-packages.md).
        static readonly string[] PackagesToAdd =
        {
            "com.unity.inputsystem",
            "com.unity.cinemachine",
            "com.unity.render-pipelines.universal",
            // "com.unity.package@1.2.3"  // pin a version with @ when a minimum is required
        };

        // Optionally drop packages in the same resolution pass (e.g. a template default you don't want).
        static readonly string[] PackagesToRemove = { };

        const double TimeoutSeconds = 600; // UPM resolution + downloads can be slow

        static AddAndRemoveRequest _request;
        static double _deadline;

        // Invoke with: -executeMethod ProjectBootstrap.PackageInstaller.Install  (NO -quit)
        public static void Install()
        {
            if (PackagesToAdd.Length == 0 && PackagesToRemove.Length == 0)
            {
                Debug.Log("[PackageInstaller] Nothing to do.");
                EditorApplication.Exit(0);
                return;
            }

            Debug.Log($"[PackageInstaller] Adding: {string.Join(", ", PackagesToAdd)}");
            _request = Client.AddAndRemove(packagesToAdd: PackagesToAdd, packagesToRemove: PackagesToRemove);
            _deadline = EditorApplication.timeSinceStartup + TimeoutSeconds;
            EditorApplication.update += Poll;
        }

        static void Poll()
        {
            if (_request == null) return;

            if (!_request.IsCompleted)
            {
                if (EditorApplication.timeSinceStartup > _deadline)
                {
                    EditorApplication.update -= Poll;
                    Debug.LogError("[PackageInstaller] Timed out waiting for UPM.");
                    EditorApplication.Exit(2);
                }
                return;
            }

            EditorApplication.update -= Poll;

            if (_request.Status == StatusCode.Success)
            {
                var names = _request.Result.Select(p => $"{p.name}@{p.version}");
                Debug.Log($"[PackageInstaller] Resolved: {string.Join(", ", names)}");
                EditorApplication.Exit(0);
            }
            else
            {
                Debug.LogError($"[PackageInstaller] Failed: {_request.Error?.message}");
                EditorApplication.Exit(1);
            }
        }
    }
}
```

`AddAndRemove` installs the whole set in a single UPM resolution pass — faster and less
error-prone than one `Client.Add` per package.

**Add / remove / upgrade with one script:**
- **Add**: list the id in `PackagesToAdd`.
- **Remove**: list the id in `PackagesToRemove`.
- **Upgrade / pin**: add the id with `@<version>` (e.g. `com.unity.cinemachine@2.9.7`). Without
  a version, resolution picks the latest compatible release.
