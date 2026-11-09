# Full topic map

If the Editor install folder has a `Data/Documentation` folder (eg `...Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), read the html files from the `en/Manual` folder.

Otherwise the docs pages are online at `https://docs.unity.com/en-us/engine/<VERSION>/manual/`. Prefer fetching the page directly (for example `WebFetch`) over searching (for example `WebSearch`) — faster and lands on the exact reference. Only fetch what you need, and only search if you don't have the exact URL. Replace `<VERSION>` with the following before fetching:

- **docs.unity3d.com**: The Unity version, eg `6000.6`
- **Package on docs.unity3d.com**: The package version, eg `@6.6` or `@2.0`. Check the package version if unsure.
- **Engine on docs.unity.com**: The Unity version, eg `6000.3`
- **docs.unity.com**: The product version, eg `7000.0`

For these Engine pages, `<VERSION>` is the Unity major.minor from `ProjectSettings/ProjectVersion.txt`, for example `6000.0` from `6000.0.58f1`, because the full build number gives a 404.

Before fetching, check that `<VERSION>` is listed as a `## Version` heading in https://docs.unity.com/en-us/engine/llms.txt. If it isn't, use the docs.unity3d.com Manual instead. The two sites use different page names, so don't reuse the paths below. Instead, find each page by its title in `https://docs.unity3d.com/<VERSION>/Documentation/Manual/docdata/toc.js`, then fetch `https://docs.unity3d.com/<VERSION>/Documentation/Manual/<link>.html`, where `<link>` is the `link` value next to the title.

- [Import a sprite or spritesheet texture](https://docs.unity.com/en-us/engine/<VERSION>/manual/unity2d/sprite/import-images-sprites.md) — local `sprite/import-images-sprites/import-images-sprites-landing.html`: setting a texture's type to Sprite (2D and UI).
- [Cut out sprites from a texture](https://docs.unity.com/en-us/engine/<VERSION>/manual/unity2d/sprite/use-editor.md) — local `sprite/sprite-editor/use-editor.html`: how the Sprite Editor defines each sprite's rectangle.
- [Sprite asset reference](https://docs.unity.com/en-us/engine/<VERSION>/manual/unity2d/sprite/class-sprite.md) — local `class-Sprite.html`: the properties of a sprite asset in the Inspector.
- [Sprite (2D and UI) texture Import Settings window reference](https://docs.unity.com/en-us/engine/<VERSION>/manual/materials-and-shaders/textures/textures-reference/texture-type-sprite.md) — local `texture-type-sprite.html`: sprite texture import settings, including Read/Write access.

## API reference

The API is `UnityEngine.Sprite` (`rect`, `texture`) and `UnityEngine.Texture2D` (`GetPixel`), part of the Unity Engine. It is versioned by Unity version, so check the project's Unity version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the project's Unity version.
2. If the Editor install folder has a `Data/Documentation` folder (e.g. `.../Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), grep the html files in the `en/ScriptReference` folder inside, and skip the remaining steps.
3. Otherwise, fetch and cache `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/xrefmap.yml` (replace `<VERSION>` with the Unity version, e.g. `6000.3`). This file lists every public API member's fully qualified name as a `uid` (e.g. `uid: 'UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)'`).
4. Grep the yml file locally for a class or method instead of refetching per lookup. The file is large (about 6 MB), so don't read the whole file.
5. Convert the `uid` to a markdown page: remove the parameters in brackets, lowercase it, replace `.` with `/`, and add `.md`. Then fetch `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/<converted uid>`. For example, `UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)` => `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unityengine/rigidbody/addforce.md`. All overloads are on the same page.
   - Constructors use `ctor` (e.g. `unityengine/vector3/ctor.md`), and indexers use `item` (e.g. `unityengine/vector3/item.md`).
   - For operators, fetch the class page (e.g. `unityengine/vector3.md`) and follow its link.
   - Links inside the pages start with `/engine/`. Add `https://docs.unity.com/en-us` before them.
   - If the page doesn't exist for that Unity version, use the `href` in the `xrefmap.yml` entry instead (e.g. `href: 'Rigidbody.AddForce.html'` => `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/Rigidbody.AddForce.html`).

On Unity versions earlier than 6000.0, which have no `xrefmap.yml`, skip steps 3 to 5 and fetch the class or member page directly, for example `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/Sprite-rect.html`.

Always use the docs for the project's Unity version rather than relying on training knowledge, since APIs are frequently marked obsolete between versions.
