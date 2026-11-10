# Check the Localization package is installed

Detail behind step 1 of the parent skill. Follow these steps in order before using any Localization API.

1. **Check by reading the project, not by asking the Package Manager.** Look for
   `com.unity.localization` in **`Packages/packages-lock.json`**, because it records what Unity
   actually resolved and reading it needs no Editor or async call. `Packages/manifest.json` only
   records what was *requested*.
2. **Install if missing:** `UnityEditor.PackageManager.Client.Add("com.unity.localization")`.
3. **Wait properly.** `Client.Add` is **asynchronous**, and busy-waiting on `IsCompleted` blocks the
   main thread you are running on. Return after firing the install, then **poll `packages-lock.json`
   in a later call** until the id appears. The install triggers a domain reload, so expect the first
   poll or two to fail.
4. **Confirm the types are actually loaded** before using them, since the lock file can be written
   before the assemblies are ready:
   ```csharp
   var t = System.Type.GetType(
       "UnityEngine.Localization.Settings.LocalizationSettings, Unity.Localization");
   return t != null ? "ready" : "not loaded yet";
   ```
   Only proceed once that returns `ready`.
