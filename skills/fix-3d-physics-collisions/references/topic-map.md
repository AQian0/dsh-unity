# Full topic map

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

If the prompt matches a [STOP CHECK](../SKILL.md#stop-check----match-before-any-tool-call) Fast-Path, skip this reading, because the Fast-Path answer is the complete response and already agrees with these pages.

If the Editor install folder has a `Data/Documentation` folder (eg `...Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), read the html files from the `<editor-install>/Editor/Data/Documentation/en/Manual` folder. Otherwise the docs pages are online at `https://docs.unity.com/en-us/engine/<VERSION>/manual/`.

   - Links inside the pages start with `/engine/`. Add `https://docs.unity.com/en-us` before them.
   - If the page doesn't exist for that Unity version, use the `href` in the `xrefmap.yml` entry instead (e.g. `href: 'Rigidbody.AddForce.html'` => `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/Rigidbody.AddForce.html`).

Prefer fetching the page directly (for example `WebFetch`) over searching (for example `WebSearch`) — faster and lands on the exact reference. Only fetch what you need, and only search if you don't have the exact URL.

Before the first fetch, read the Unity version from `ProjectSettings/ProjectVersion.txt`, because the docs differ between versions. Replace `<VERSION>` in docs.unity.com and docs.unity3d.com links with only its major.minor (the first two numbers), because the full build number gives a 404.

- [Interaction between collider types](https://docs.unity.com/en-us/engine/<VERSION>/manual/physics-section/physics-overview/collision-section/collider-interactions/collider-types-interaction.md) — local `collider-types-interaction.html`: which collider pairs send collision or trigger messages.
- [OnCollision events](https://docs.unity.com/en-us/engine/<VERSION>/manual/physics-section/physics-overview/collision-section/collider-interactions/oncollision.md) — local `collider-interactions-oncollision.html`: when Unity calls the OnCollisionEnter, Stay, and Exit events.
- [OnTrigger events](https://docs.unity.com/en-us/engine/<VERSION>/manual/physics-section/physics-overview/collision-section/collider-interactions/ontrigger.md) — local `collider-interactions-ontrigger.html`: how trigger colliders call OnTriggerEnter, Stay, and Exit.
- [Layer-based collision detection](https://docs.unity.com/en-us/engine/<VERSION>/manual/physics-section/physics-overview/collision-section/collision-detection/layer-based-collision.md) — local `LayerBasedCollision.html`: setting which layers collide in the Layer Collision Matrix.
- [Choose a collision detection mode](https://docs.unity.com/en-us/engine/<VERSION>/manual/physics-section/physics-overview/collision-section/collision-detection/choose-collision-detection-mode.md) — local `choose-collision-detection-mode.html`: picking Discrete or continuous detection for fast-moving objects.
- [Physics settings](https://docs.unity.com/en-us/engine/<VERSION>/manual/unity-editor/editor-settings-reference/comp-manager-group/class-physics-manager.md) — local `class-PhysicsManager.html`: project-wide settings such as Contact Pairs Mode, Queries Hit Triggers, Invoke Collision Callbacks, and Simulation Mode.
- [Mesh collider component reference](https://docs.unity.com/en-us/engine/<VERSION>/manual/physics-section/physics-overview/collision-section/collider-shapes/mesh-colliders/class-mesh-collider.md) — local `class-MeshCollider.html`: Mesh Collider properties, including Convex and mesh cooking options.
- [Character Controller component reference](https://docs.unity.com/en-us/engine/<VERSION>/manual/physics-section/physics-overview/character-control-section/class-character-controller.md) — local `class-CharacterController.html`: how a CharacterController moves and collides without a Rigidbody.

## API reference

The API is `UnityEngine.Physics`, `UnityEngine.Rigidbody`, `UnityEngine.Collider`, `UnityEngine.CharacterController`, and `UnityEngine.PhysicsScene`, part of the Unity Engine. It is versioned by Unity version, so check the project's Unity version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the project's Unity version.
2. If the Editor install folder has a `Data/Documentation` folder, grep the html files in the `en/ScriptReference` folder inside, and skip the remaining steps.
3. Otherwise, fetch and cache `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/xrefmap.yml`. This file lists every public API member's fully qualified name as a `uid` (e.g. `uid: 'UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)'`).
4. Grep the yml file locally for a class or method instead of refetching per lookup. The file is large (about 6 MB), so don't read the whole file.
5. Convert the `uid` to a markdown page: remove the parameters in brackets, lowercase it, replace `.` with `/`, and add `.md`. Then fetch `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/<converted uid>`. For example, `UnityEngine.Rigidbody.AddForce(UnityEngine.Vector3)` => `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unityengine/rigidbody/addforce.md`. All overloads are on the same page.
   - Constructors use `ctor` (e.g. `unityengine/vector3/ctor.md`), and indexers use `item` (e.g. `unityengine/vector3/item.md`).
   - For operators, fetch the class page (e.g. `unityengine/vector3.md`) and follow its link.

Always use the docs for the project's Unity version rather than relying on training knowledge, since APIs are frequently marked obsolete between versions.
