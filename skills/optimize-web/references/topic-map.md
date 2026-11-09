# Full topic map

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

If the Editor install folder has a `Data/Documentation` folder (eg `...Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), read the html files from the `<editor-install>/Editor/Data/Documentation/en/Manual` folder. Otherwise the docs pages are online at `https://docs.unity.com/en-us/engine/<VERSION>/manual/`.

For the packages this skill uses (`com.unity.cloud.ktx`, `com.unity.addressables`, `com.unity.web.stripping-tool`), the docs pages are local markdown conversions of the Unity Manual, stored at `<project-folder>/Library/PackageCache/<package-name>@*/`. Read only the .md files in that specific `PackageCache` subfolder. You must not look at non-.md files, or look outside at other Library or PackageCache folders, otherwise it takes too much time. If that folder has no `.md` files, use `https://docs.unity3d.com/Packages/<package-name>@<VERSION>/manual/` instead.

Prefer `WebFetch` over `WebSearch` — faster and lands on the exact reference. Only fetch what you need. Replace `<VERSION>` with the following before fetching:

- **docs.unity3d.com**: The Unity version, eg `6000.6`
- **Package on docs.unity3d.com**: The package version, eg `@6.6` or `@2.0`. Check the package version if unsure.
- **docs.unity.com**: The Unity version, eg `6000.6`

Read the Unity major.minor from `ProjectSettings/ProjectVersion.txt` (for example `6000.0` from `6000.0.58f1`, because the full build number gives a 404), and each package's major.minor from `Packages/packages-lock.json`.

- [Recommended Player settings to optimize your Web build](https://docs.unity.com/en-us/engine/<VERSION>/manual/platform-specific/webgl/building-distribution/web-optimization/player.md) — local `web-optimization-player.html`: release values for compression, stripping, exceptions and memory.
- [Use C# code to enable optimization settings](https://docs.unity.com/en-us/engine/<VERSION>/manual/platform-specific/webgl/building-distribution/web-optimization/c-sharp.md) — local `web-optimization-c-sharp.html`: editor script that applies the recommended settings in one step.
- [Remove unused resources from your Web build](https://docs.unity.com/en-us/engine/<VERSION>/manual/platform-specific/webgl/building-distribution/web-optimization/remove-resources.md) — local `web-optimization-remove-resources.html`: removing unused packages and stripping shader variants.
- [Distribution size and code stripping](https://docs.unity.com/en-us/engine/<VERSION>/manual/platform-specific/webgl/building-distribution/distributionsize-codestripping.md) — local `webgl-distributionsize-codestripping.html`: what drives Web build size and how stripping works.
- [Deploy a Web application](https://docs.unity.com/en-us/engine/<VERSION>/manual/platform-specific/webgl/building-distribution/deploying.md) — local `webgl-deploying.html`: server compression headers, MIME types and Decompression Fallback.
- [Memory in Unity Web](https://docs.unity.com/en-us/engine/<VERSION>/manual/platform-specific/webgl/develop/memory.md) — local `webgl-memory.html`: Wasm heap size, memory growth and browser memory limits.

## API reference

The API is `UnityEditor.PlayerSettings`, `UnityEditor.PlayerSettings.WebGL` and `UnityEditor.WebGL.UserBuildSettings`, part of the Unity Engine. It is versioned by Unity version, so check the project's Unity version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the project's Unity version.
2. If the Editor install folder has a `Data/Documentation` folder (e.g. `.../Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), grep the html files in the `en/ScriptReference` folder inside, and skip the remaining steps.
3. Otherwise, fetch and cache `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/xrefmap.yml` (replace `<VERSION>` with the Unity version, e.g. `6000.3`). This file lists every public API member's fully qualified name as a `uid` (e.g. `uid: 'UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)'`).
4. Grep the yml file locally for a class or method instead of refetching per lookup. The file is large (about 6 MB), so don't read the whole file.
5. Convert the `uid` to a markdown page: remove the parameters in brackets, lowercase it, replace `.` with `/`, and add `.md`. Then fetch `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/<converted uid>`. For example, `UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)` => `https://docs.unity.com/en-us/engine/6000.3/script-reference/unityengine/rigidbody/addforce.md`. All overloads are on the same page.
   - Constructors use `ctor` (e.g. `unityengine/vector3/ctor.md`), and indexers use `item` (e.g. `unityengine/vector3/item.md`).
   - For operators, fetch the class page (e.g. `unityengine/vector3.md`) and follow its link.
   - Links inside the pages start with `/engine/`. Add `https://docs.unity.com/en-us` before them.
   - If the page doesn't exist for that Unity version, use the `href` in the `xrefmap.yml` entry instead (e.g. `href: 'Rigidbody.AddForce.html'` => `https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Rigidbody.AddForce.html`).

Always use the docs for the project's Unity version rather than relying on training knowledge, since APIs are frequently marked obsolete between versions.

The KTX API (`KtxUnity`) is part of the `com.unity.cloud.ktx` package. It is versioned by package version, not Unity version, so check the project's installed package version before relying on a specific class or method.

1. Read the installed package version from `Packages/packages-lock.json`.
2. Fetch and cache `https://docs.unity3d.com/Packages/com.unity.cloud.ktx@<version>/xrefmap.yml` (replace `<version>` with the installed package version, e.g. `3.4`). This file maps every public API member's fully qualified name to its docs page `href`.
3. Grep the yml file locally for a class or method instead of refetching per lookup. Don't read the whole file.
