# API reference

The API reference URLs contain `<VERSION>`. Replace it with the major.minor version only, for example `6000.0` from `6000.0.58f1` in `ProjectSettings/ProjectVersion.txt`, or `16.9` for the package in `Packages/packages-lock.json`, because the full build number gives a 404.

The API is `Unity.Services.Vivox`, part of the `com.unity.services.vivox` package. It is versioned by package version, not Unity version (e.g. `@16.4`, `@16.9`), so check the project's installed package version before relying on a specific class or method.

1. Read the installed package version from `Packages/packages-lock.json`.
2. Fetch and cache `https://docs.unity3d.com/Packages/com.unity.services.vivox@<VERSION>/xrefmap.yml` (replace `<VERSION>` with the installed package version, e.g. `16.9`). This file maps every public API member's fully qualified name to its docs page `href` (e.g. `href: api/Unity.Services.Vivox.IVivoxService.html` => `https://docs.unity3d.com/Packages/com.unity.services.vivox@<VERSION>/api/Unity.Services.Vivox.IVivoxService.html`).
3. Grep the yml file locally for a class or method instead of refetching per lookup. Don't read the whole file.

Always fetch the version matching the installed package rather than relying on training knowledge, since APIs are frequently marked obsolete between major versions (e.g. the v4 `Client` and `ILoginSession` model is gone in v16).

The microphone permission API is `UnityEngine.Android.Permission`, part of the Unity Engine. It is versioned by Unity version, so check the project's Unity version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the project's Unity version.
2. If the Editor install folder has a `Data/Documentation` folder (e.g. `.../Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), grep the html files in the `en/ScriptReference` folder inside, and skip the remaining steps.
3. Otherwise, fetch and cache `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/xrefmap.yml` (replace `<VERSION>` with the Unity version, e.g. `6000.3`). This file lists every public API member's fully qualified name as a `uid` (e.g. `uid: 'UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)'`).
4. Grep the yml file locally for a class or method instead of refetching per lookup. The file is large (about 6 MB), so don't read the whole file.
5. Convert the `uid` to a markdown page: remove the parameters in brackets, lowercase it, replace `.` with `/`, and add `.md`. Then fetch `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/<converted uid>`. For example, `UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)` => `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unityengine/rigidbody/addforce.md`. All overloads are on the same page.
   - Constructors use `ctor` (e.g. `unityengine/vector3/ctor.md`), and indexers use `item` (e.g. `unityengine/vector3/item.md`).
   - For operators, fetch the class page (e.g. `unityengine/vector3.md`) and follow its link.
   - Links inside the pages start with `/engine/`. Add `https://docs.unity.com/en-us` before them.
   - If the page doesn't exist for that Unity version, use the `href` in the `xrefmap.yml` entry instead (e.g. `href: 'Rigidbody.AddForce.html'` => `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/Rigidbody.AddForce.html`).

If the Unity version is earlier than 6000.0, the Engine `xrefmap.yml` and `.md` pages don't exist, so fetch `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/Android.Permission.RequestUserPermission.html` directly.

Always use the docs for the project's Unity version rather than relying on training knowledge, since APIs are frequently marked obsolete between versions.

