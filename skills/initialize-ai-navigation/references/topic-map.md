# Full topic map

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

The docs pages are local markdown conversions of the Unity Manual, stored at `<project-folder>/Library/PackageCache/com.unity.ai.navigation@*/`. Read only the .md files in that specific `PackageCache` subfolder (they're in its `Documentation~/` folder). You must not look at non-.md files, or look outside at other Library or PackageCache folders, otherwise it takes too much time. If that folder has no `.md` files, read the same pages online at `https://docs.unity3d.com/Packages/com.unity.ai.navigation@<VERSION>/manual/<page>.html`, because some package versions don't ship their docs.

Prefer `WebFetch` over `WebSearch` — faster and lands on the exact reference. Only fetch what you need. Replace `<VERSION>` with the following before fetching:

- **Package on docs.unity3d.com**: The package version, eg `@1.1` or `@2.0`. Check the package version if unsure.
- **docs.unity.com**: The product version, eg `7000.0`

Read the Unity version from `ProjectSettings/ProjectVersion.txt`. For the package docs, use the major.minor version of `com.unity.ai.navigation` from `Packages/packages-lock.json`.

- **Install AI Navigation** — `InstallAINav.md`: how to add the package to a project.
- **Inner workings of the navigation system** — `NavInnerWorkings.md`: pathfinding, steering, avoidance and voxel bake quality.
- **About agents** — `AboutAgents.md`; **About obstacles** — `AboutObstacles.md`: agent cylinders, and when an obstacle should carve or only obstruct.
- **Navigation areas and costs** — `AreasAndCosts.md`: built-in and custom area types, path cost, agent area masks.
- **Create a NavMesh / agent / obstacle / link** — `CreateNavMesh.md`, `CreateNavMeshAgent.md`, `CreateNavMeshObstacle.md`, `CreateNavMeshLink.md`: setup procedure for each component.
- **Use NavMesh agents with other components** — `MixingComponents.md`: combining agents with Rigidbody, Animator and NavMesh Obstacle.
- **Navigation window** — `NavigationWindow.md`: agent type and area type settings.
- **Component references** — `NavMeshSurface.md`, `NavMeshAgent.md`, `NavMeshObstacle.md`, `NavMeshLink.md`, `NavMeshModifier.md`, `NavMeshModifierVolume.md`: every Inspector property and its default.
- **OffMesh Link component (deprecated)** — `OffMeshLink.md`: the legacy link component to migrate away from.
- **Move to a destination / clicked position / patrol** — `NavMoveToDestination.md`, `NavMoveToClickPoint.md`, `NavAgentPatrol.md`: movement scripts to save into the project.
- **Couple animation and navigation** — `CouplingAnimationAndNavigation.md`: Animator setup, blend tree and locomotion scripts.

## API reference

The package API is `Unity.AI.Navigation` (`NavMeshSurface`, `NavMeshLink`, `NavMeshModifier`, `NavMeshModifierVolume`), part of the `com.unity.ai.navigation` package. It is versioned by package version, not Unity version (e.g. `@1.1`, `@2.0`), so check the project's installed package version before relying on a specific class or method.

If the package is installed, grep the `.cs` files in `<project-folder>/Library/PackageCache/com.unity.ai.navigation@*/` for the class or member and read its `///` XML doc comments, because they hold the API reference text for the exact installed version. This is the only exception to reading `.md` files only in that folder. Use the following steps only when the package isn't installed yet, for example to decide whether the API fits the user's scenario:

1. Find the major.minor of the version you'd install, as described in [Package Installation Check](#0-package-installation-check).
2. Fetch and cache `https://docs.unity3d.com/Packages/com.unity.ai.navigation@<version>/xrefmap.yml` (replace `<version>` with that major.minor version, e.g. `2.0`). This file maps every public API member's fully qualified name to its docs page `href` (e.g. `href: api/Unity.AI.Navigation.NavMeshSurface.html` => `https://docs.unity3d.com/Packages/com.unity.ai.navigation@2.0/api/Unity.AI.Navigation.NavMeshSurface.html`).
3. Grep the yml file locally for a class or method instead of refetching per lookup. Don't read the whole file.

The agent and query API is `UnityEngine.AI` (`NavMeshAgent`, `NavMesh`, `NavMeshPath`, `NavMeshObstacle`), part of the Unity Engine. It is versioned by Unity version, so check the project's Unity version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the project's Unity version.
2. If the Editor install folder has a `Data/Documentation` folder (e.g. `.../Unity/Hub/Editor/6000.6.0b2/Editor/Data/Documentation`), grep the html files in the `en/ScriptReference` folder inside, and skip the remaining steps.
3. Otherwise, fetch and cache `https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/xrefmap.yml` (replace `<VERSION>` with the Unity version, e.g. `6000.3`). This file lists every public API member's fully qualified name as a `uid` (e.g. `uid: 'UnityEngine.AI.NavMeshAgent.SetDestination(UnityEngine.Vector3)'`).
4. Grep the yml file locally for a class or method instead of refetching per lookup. The file is large (about 6 MB), so don't read the whole file.
5. Convert the `uid` to a markdown page: remove the parameters in brackets, lowercase it, replace `.` with `/`, and add `.md`. Then fetch `https://docs.unity.com/en-us/engine/<VERSION>/script-reference/<converted uid>`. For example, `UnityEngine.AI.NavMeshAgent.SetDestination(UnityEngine.Vector3)` => `https://docs.unity.com/en-us/engine/6000.3/script-reference/unityengine/ai/navmeshagent/setdestination.md`. All overloads are on the same page.
   - Constructors use `ctor` (e.g. `unityengine/ai/navmeshpath/ctor.md`), and indexers use `item`.
   - For operators, fetch the class page (e.g. `unityengine/ai/navmeshagent.md`) and follow its link.
   - Links inside the pages start with `/engine/`. Add `https://docs.unity.com/en-us` before them.
   - If the page doesn't exist for that Unity version, use the `href` in the `xrefmap.yml` entry instead (e.g. `href: 'AI.NavMeshAgent.SetDestination.html'` => `https://docs.unity3d.com/6000.3/Documentation/ScriptReference/AI.NavMeshAgent.SetDestination.html`).

Always use the docs for the installed package and Unity version rather than relying on training knowledge, since APIs are frequently marked obsolete between versions (e.g. the `OffMeshLink` component is deprecated in favour of `NavMeshLink`).

## Passing C# to `eval`

`script eval` compiles a **statement block, not a file**, so these are compile errors rather than warnings:

| Error | Cause | Fix |
|---|---|---|
| `CS0210` | A `using` directive, such as `using UnityEngine;`, read as a resource-disposal statement | Remove every `using` directive |
| `CS0246` / `CS0103` | A bare type name, such as `AssetDatabase` | Fully qualify the type, such as `UnityEditor.AssetDatabase` |
| `CS0104` | A bare `Object`, which is ambiguous with `object` | Write `UnityEngine.Object` |

Where a snippet below is written as a file — with usings, for readability, or because it is
meant to be saved into the project — qualify the types before passing it to `script eval`.
