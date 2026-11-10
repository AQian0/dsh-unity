---
name: create-2d-physics
description: "Creates and fixes Unity 2D physics in both systems, 2D Physics Core and the legacy Rigidbody 2D system. Use when the user asks about any 2D physics task, even if neither system is named. Not for 3D physics."
allowed-tools: web_fetch, web_search
metadata:
  version: 0.3.0
  support: "https://unity.com/support-services"
---

# Create and fix Unity 2D physics

Do not weigh 3D physics options. If evidence shows the user means 3D, say so and stop.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Before making changes, establish a baseline of the current behavior so you can tell whether a later result is actually caused by your change.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Avoid long explanations.
- Verify runtime behaviour with temporary `Debug.Log` lines, then remove them, because the user didn't ask for logging and leftover lines clutter their script and console. Don't build settle-detection or permanent logging they didn't ask for. See [Final step](#final-step).
- Never reflect over types to discover an API — fetch the member page instead. The system probe is the one exception.

### Passing C# to `script eval`

`script eval` compiles a statement block, not a file, so write the code without `using` directives and with fully qualified types. `return` what you want to read; it arrives at `data.result.result`. If the code doesn't compile, look up the error here:

| Error | Cause | Fix |
| --- | --- | --- |
| `CS0210` | A `using` directive, which the compiler reads as a resource-disposal statement | Remove the directive and qualify the types |
| `CS0246` / `CS0103` | An unqualified type, such as `Rigidbody2D` or `PhysicsWorld` | Use the full name, such as `UnityEngine.Rigidbody2D` or `Unity.U2D.Physics.PhysicsWorld` |
| `CS0104` | A bare `Object`, which is ambiguous with `object` | Use `UnityEngine.Object` |

## Step 0: Which physics system

Unity has two 2D physics systems. They share no code and never interact. Identify which one before writing any physics code — an answer from the wrong system compiles, runs, and does nothing.

Check the request, scene and existing scripts against the table below, in this order:

1. Check the scene components and existing scripts first, because components are the reliable signal.
2. Check the user's request wording: "add a collider" is component language, "spawn a thousand" is script language.
3. If still unsure which systems are installed, run the probe below.
4. If the route is still unknown, stop and ask — offer all three routes and never choose for the user.

| Signal | System |
| --- | --- |
| Physics Pose, Area, Constraint or Simulation components | Core components, 6000.7+ with the package |
| Rigidbody 2D, Collider 2D, Joint 2D, Effector 2D | Legacy |
| `Unity.U2D.Physics` or `UnityEngine.LowLevelPhysics2D` types in script | Core in script |
| `Rigidbody2D`, `Collider2D`, `Physics2D` types | Legacy |
| Both present | Separate simulations. Say so, treat separately |
| No signal | Stop and ask, offering the three routes above |

Key:
- Legacy = Rigidbody 2D and Collider 2D components.
- Core components = Physics Pose and Physics Area, requiring `com.unity.2d.physics` and Unity 6000.7+.
- Core in script = `Unity.U2D.Physics` API, no package needed.

Probe:
```
unity command script eval --caller plugin --skill create-2d-physics --code 'var r = ""; foreach (var n in new[] { "UnityEngine.Rigidbody2D", "Unity.U2D.Physics.PhysicsWorld", "UnityEngine.LowLevelPhysics2D.PhysicsWorld", "Unity.U2D.Physics.PhysicsPose" }) { var f = false; foreach (var a in System.AppDomain.CurrentDomain.GetAssemblies()) if (a.GetType(n) != null) f = true; r += f + ","; } return r;'
```
The Probe returns: legacy present, Core as `Unity.U2D.Physics`, Core as `UnityEngine.LowLevelPhysics2D`, Core components present. Core exists if either Core value is true; the true one gives the namespace. `false` rules that route out.

## Full topic map

Before a workflow or diagnosis, read the documentation pages that cover the subject and check
what you might have missed; name the files you read in your response. Training knowledge about
Unity can be out of date or for the wrong version.

- **2D Physics Core**: components, configuring them, creating bodies in script, ownership, and
  the full Core topic map — [2d-physics-core.md](references/2d-physics-core.md).
- **Legacy 2D physics**: the legacy manual topic map — [legacy-2d-physics.md](references/legacy-2d-physics.md).
- **Docs URLs, version selection, local HTML fallback, and the xrefmap recipe**:
  [api-docs.md](references/api-docs.md). Prefer `WebFetch` over `WebSearch` and fetch only what
  you need; read the package version from `Packages/packages-lock.json` when the manifest holds
  a range or a git URL.

## Worked examples

Prefer in order: the C# example on the type or member page you are using; existing project scripts (match their style); the sample project at `https://github.com/Unity-Technologies/PhysicsExamples2D`. Check all three before inventing a pattern.

## Final step

Physics changes alter runtime behaviour, so a clean compile isn't enough. Run these checks in order. If any check fails, reread the docs page in [api-docs.md](references/api-docs.md) to find out what you missed, fix it, and run the checks again.

1. Use `console_status` to check the project has zero console errors.
2. Read back what you changed, because a change can compile cleanly and still do nothing:
   - For components you added or configured in the scene, use `script eval` to check each one exists on its GameObject and its properties hold the values you set, such as a Collider 2D's `isTrigger` or the members listed on a Core component's type page.
   - For a script, read it back and check it uses the system and namespace from [Step 0](#step-0-which-physics-system), and sets each Core body's `type` explicitly.
3. Add temporary `Debug.Log` lines that print the behaviour you changed, such as a body's position or velocity, or a contact or trigger callback firing.
4. Enter Play mode and check the console shows the expected log lines and still has zero errors. You can also read the world through `script eval`. Take no screenshots, because they take too much time.
5. Exit Play mode, remove the temporary `Debug.Log` lines, and check the console again has zero errors.

## Final report

Short checklist: what you changed and why, which physics system you used, anything left for the user to decide or do.

