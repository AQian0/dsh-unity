# Discovering / verifying packages

To confirm an id exists or list its versions before adding it, search the registry. The
in-Editor `Client.SearchAll()` / `Client.Search("<id>")` calls are also async, so they use the
**same poll-and-`Exit` pattern and the same headless run** as the installer. Write
`Assets/Editor/ProjectBootstrap/PackageSearch.cs`:

```csharp
using System.Linq;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEditor.PackageManager.Requests;
using UnityEngine;

namespace ProjectBootstrap
{
    public static class PackageSearch
    {
        const double TimeoutSeconds = 120;
        static SearchRequest _request;
        static double _deadline;

        // Invoke with: -executeMethod ProjectBootstrap.PackageSearch.SearchAll  (NO -quit)
        public static void SearchAll()
        {
            _request = Client.SearchAll();                 // or Client.Search("com.unity.cinemachine")
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
                    Debug.LogError("[PackageSearch] Timed out.");
                    EditorApplication.Exit(2);
                }
                return;
            }
            EditorApplication.update -= Poll;

            if (_request.Status == StatusCode.Success)
            {
                foreach (var p in _request.Result.OrderBy(p => p.name))
                    Debug.Log($"[PackageSearch] {p.name}@{p.versions.latestCompatible}  {p.displayName}");
                Debug.Log($"[PackageSearch] {_request.Result.Length} packages found.");
                EditorApplication.Exit(0);
            }
            else
            {
                Debug.LogError($"[PackageSearch] Failed: {_request.Error?.message}");
                EditorApplication.Exit(1);
            }
        }
    }
}
```

`_request.Result` is a `PackageInfo[]`; each entry exposes `name`, `displayName`, `description`,
and `versions` (`.latest`, `.latestCompatible`, `.all`). For a terminal-only check without the
Editor (a **known** id, not free-text search), query the registry directly — see
[references/select-packages.md](references/select-packages.md#discovering-and-verifying-packages).
