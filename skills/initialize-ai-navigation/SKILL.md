---
name: initialize-ai-navigation
description: Sets up and configures Unity AI Navigation, including NavMesh surfaces, agents, obstacles, and links. Use when the user asks about navigation meshes, pathfinding, patrol routes, or obstacle avoidance.
---

Determine what the user needs and guide them through navigation setup. See [navigation-system.md](references/navigation-system.md) for expanded component details, API notes, code recipes, and troubleshooting.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Before making changes, establish a baseline of the current behavior so you can tell whether a later result is actually caused by your change.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for. See [Final step](#final-step).
- Avoid long explanations.

## Full topic map

Documentation pages and API entry points: [references/topic-map.md](references/topic-map.md).
## Routing Logic

| User Says | Interpretation |
|-----------|---------------|
| "add navigation" / "set up nav" | Full setup: NavMeshSurface + bake + NavMeshAgent |
| "make this character navigate" | Add NavMeshAgent, ensure NavMesh exists |
| "add pathfinding" | NavMeshAgent + movement script |
| "agent won't move" / "path not found" | Troubleshoot — see Troubleshooting Decision Tree in reference |
| "avoid obstacles" | NavMeshObstacle with carving or avoidance |
| "connect two areas" / "jump across" | NavMeshLink between areas |
| "patrol between points" | NavMeshAgent + patrol script |
| "click to move" | NavMeshAgent + raycast click-to-move script |
| "animate the character while navigating" | Couple Animator with NavMeshAgent |
| "different agent sizes" | Configure agent types in Navigation window |
| "areas and costs" / "restrict areas" | NavMesh area types, modifiers, and agent area masks |

## Workflow

### 0. Package Installation Check
Before doing anything else, verify that `com.unity.ai.navigation` is installed. If it's missing,
add it to `Packages/manifest.json` under `dependencies` — Unity resolves it when the Editor next
regains focus, and this needs no Editor connection:

```json
"com.unity.ai.navigation": "<current 2.x version>"
```

Don't invent the version string, and don't copy another package's version, because package
versions are independent. You must read the latest 2.x version from the Unity registry:
`https://packages.unity.com/com.unity.ai.navigation` lists every published version. Use version 2.0.16 when in doubt.

Proceed only once it's confirmed installed. If you have a live Editor to run C# in, see
[navigation-system.md](references/navigation-system.md) for the `Client.Add` equivalent.

### 1. Pre-Flight: Assess Current Navigation Setup
Before making changes, inspect what already exists:
1. Find the existing navigation components. With a connected Editor, query the live scene for
   `NavMeshSurface`, `NavMeshAgent`, `NavMeshObstacle`, `NavMeshLink` and `NavMeshModifier` — see
   the `unity-cli` skill for driving a running Editor. Without one, search the scene and prefab
   files for those component names.
2. List the configured agent types. With a connected Editor, loop over
   `UnityEngine.AI.NavMesh.GetSettingsCount()` and `GetSettingsByIndex(i)`, and name each with
   `GetSettingsNameFromID(settings.agentTypeID)`. Without one, read the `m_SettingNames` section in `ProjectSettings/NavMeshAreas.asset`.
3. Summarize ALL detected navigation components before proposing changes.

### 2. Gather Missing Information
Before creating components, ensure the user has specified: walkable surfaces, agent type/size, agent behavior, obstacles, links, and area/cost requirements. Ask if anything is unclear. See the Information Gathering Checklist in the reference for full details.

### 3. Planning & Execution
Follow this general order. See the Component Setup Guide in the reference for detailed step-by-step instructions per component:
1. **NavMesh Surface** — create the walkable mesh (bake it)
2. **NavMesh Agent** — add pathfinding characters
3. **NavMesh Obstacle** — add dynamic obstacles
4. **NavMesh Link** — connect disconnected NavMesh areas
5. **NavMesh Modifier / Modifier Volume** — fine-tune area types
6. **Scripts** — movement, patrol, click-to-move, animation coupling (see Common Recipes in reference)

### 4. Validation
After setup, read these values with `eval` (fully qualified) rather than checking the Scene view by eye, because a NavMesh that looks right can still be missing or mismatched:

1. Each `NavMeshSurface` has baked data: `navMeshData` isn't null.
2. Each `NavMeshSurface.agentTypeID` matches the `NavMeshAgent.agentTypeID` of the agents that walk on it.
3. Each agent can reach its destination: `agent.CalculatePath` to the target returns `true`, and the path's `status` is `PathComplete`. Use `NavMesh.CalculatePath(Vector3, Vector3, NavMeshQueryFilter, NavMeshPath)` if you check paths when a NavMeshAgent is not available.
4. `NavMeshObstacle.carving` is on for NavMeshObstacle components that stay still in the scene or are expected to move slowly, and off for those expected to move fast.
5. Each `NavMeshLink` has `activated` set to `true`, and `NavMesh.SamplePosition` finds the NavMesh within a short distance of both ends.
6. Each agent's `areaMask` includes every area it must cross.
7. No conflicting components (see Mixing Components Guide in reference).
8. If a NavMeshAgent's GameObject has a Rigidbody, `isKinematic` is `true`.

If a check fails, fix it and run the checks again before the Final step.

## Final step

Do the following checks:

1. Check the project has zero console errors. Use `console_status` for counts.
2. Stop there unless the user asked you to prove it works or you suspect a specific fault.
3. If you do enter Play mode, do it once only to chase a fault you already suspect. Read the world through `eval` rather than adding logging, for example each agent's `pathStatus` and `remainingDistance` to see whether it reaches its destination. Take no screenshots as they take too much time.

If a check fails, go back and reread the [docs pages](#full-topic-map) to find out what you missed.

## Final report

Summarize what was created or changed:
- NavMesh Surfaces: which GameObject, agent type, geometry mode, bake status
- NavMesh Agent(s): which GameObject, speed, stopping distance, area mask
- NavMesh Obstacle(s): which GameObject, shape, carve on/off
- NavMesh Link(s): start/end, bidirectional, area type
- Scripts: which scripts attached to which GameObjects
- Any manual steps required (adjust waypoints, re-bake after scene changes, etc.)
