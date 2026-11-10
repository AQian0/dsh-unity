# 2D physics documentation map and API lookup

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

Prefer `WebFetch` over `WebSearch` — faster and lands on the exact reference. Only fetch what you need. Replace `<VERSION>` with the following before fetching:

- **Package on docs.unity3d.com**: The package version, eg `@6.6` or `@2.0`. Check the package version if unsure.
- **docs.unity.com**: The product version, eg `7000.0`

For docs.unity.com engine pages, use the Unity version, e.g. `6000.7`. Pages are markdown — URLs end in `.md`. Find the package version in `Packages/packages-lock.json`, because `manifest.json` can hold a range or a git URL instead of the resolved version.

If the Editor install folder has a `Data/Documentation` folder (eg `...Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), read the html files from the `en/Manual` folder. Otherwise use the online `.md` pages listed in the references below.

Once you know the route, read the matching reference before acting:
- [2D Physics Core reference](references/2d-physics-core.md) - components, configuring them, creating bodies in script, ownership, and the full Core topic map.
- [Legacy 2D physics reference](references/legacy-2d-physics.md) - the legacy manual topic map.

### API reference

The Core and legacy APIs (`Unity.U2D.Physics` or `UnityEngine.LowLevelPhysics2D`, and `UnityEngine.Rigidbody2D`, `Collider2D`, `Physics2D`) are part of the Unity Engine. They are versioned by Unity version, so check the project's Unity version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the project's Unity version.
2. If the Editor install folder has a `Data/Documentation` folder, grep the html files in the `en/ScriptReference` folder inside, and skip the remaining steps.
3. Otherwise, fetch and cache `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/xrefmap.yml` (replace `<VERSION>` with the project's Unity version in major.minor form). This file lists every public API member's fully qualified name as a `uid` (e.g. `uid: 'UnityEngine.Rigidbody2D.AddForce(UnityEngine.Vector2,UnityEngine.ForceMode2D)'`).
4. Grep the yml file locally for a class or method instead of refetching per lookup. The file is large (about 6 MB), so don't read the whole file.
5. Convert the `uid` to a markdown page: remove the parameters in brackets, lowercase it, replace `.` with `/`, and add `.md`. Then fetch `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/<converted uid>`. For example, `UnityEngine.Rigidbody2D.AddForce(UnityEngine.Vector2,UnityEngine.ForceMode2D)` => `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unityengine/rigidbody2d/addforce.md`. All overloads are on the same page.
   - Constructors use `ctor` (e.g. `unityengine/vector2/ctor.md`), and indexers use `item` (e.g. `unityengine/vector2/item.md`).
   - For operators, fetch the class page (e.g. `unityengine/vector2.md`) and follow its link.
   - Links inside the pages start with `/engine/`. Add `https://docs.unity.com/en-us` before them.
   - If the page doesn't exist for that Unity version, use the `href` in the `xrefmap.yml` entry instead (e.g. `href: 'Rigidbody2D.AddForce.html'` => `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/Rigidbody2D.AddForce.html`).

The Core **components** (Physics Pose, Area, Constraint, Simulation) are in the `Unity.U2D.Physics` namespace of the `com.unity.2d.physics` package. They are versioned by package version, not Unity version, so check the installed package version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the installed package version.
2. Fetch and cache `https://docs.unity3d.com/Packages/com.unity.2d.physics@<version>/xrefmap.yml` (replace `<version>` with the installed package version in major.minor form). This file maps every public API member's fully qualified name to its docs page `href` (e.g. `href: api/Unity.U2D.Physics.PhysicsPose.html` => `https://docs.unity3d.com/Packages/com.unity.2d.physics@<version>/api/Unity.U2D.Physics.PhysicsPose.html`).
3. Grep the yml file locally for a class or method instead of refetching per lookup. Don't read the whole file.

Always use the docs matching the project's Unity version and installed package version rather than relying on training knowledge, because APIs are often marked obsolete between versions and a member you recall might be obsolete or removed in the project's version.

