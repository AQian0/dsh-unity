---
name: fix-3d-physics-collisions
description: Diagnoses and fixes 3D PhysX collision, trigger, and raycast problems. Use when asked to fix OnCollisionEnter or OnTriggerEnter not firing, objects passing through each other, raycasts that miss, or a misbehaving MeshCollider.
required_editor_version: ">=6000.3"
---

# Diagnose and fix 3D physics collisions

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Don't use `using` directives or unqualified types in the `snippet` for `eval`, because the compiler only reads `using UnityEngine`, and a bare `AssetDatabase` or `Object` causes errors (CS0246 / CS0103 / CS0104). `return` what you want to read; it arrives at `data.result.result`.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Avoid long explanations.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for, because it clutters their project and console. Read state through `eval` instead, as described in [Final step](#final-step).

## Full topic map

Read [topic-map.md](references/topic-map.md) before any diagnosis that a Fast-Path doesn't already answer, because this skill's rules must match the installed Unity version. It covers whether the Editor ships local docs or you need docs.unity.com, how to version those URLs, which manual pages cover each condition, and the API lookup route.

## Procedure

1. Before you call any tool, match the prompt against the [STOP CHECK](#stop-check----match-before-any-tool-call) Fast-Paths. If one matches, write that answer and go to step 5.
2. Otherwise, get the Unity version from `ProjectSettings/ProjectVersion.txt`, and check which physics components the objects use (Rigidbody, Collider, `CharacterController`). If there's no project or no version, assume Unity 6000.3 and 3D PhysX, say so in your answer, and carry on. If the user gives no symptom, script, or scene to work on, ask for it.
3. Read the [documentation pages](#full-topic-map) for the symptom.
4. Find the symptom in [Identify your symptom](#identify-your-symptom), read the reference it points to, and work through it within the [Tool budget](#tool-budget).
5. If you changed the project, run the [Final step](#final-step) checks. The Tool budget limits diagnosis, not these checks.
6. End with the answer described in [Required output](#required-output----non-negotiable). If you changed the project, use the [Final report](#final-report) format.

## CRITICAL FACT (read first, do not override)

Read [kinematic-trigger-facts.md](references/kinematic-trigger-facts.md) before answering anything about two kinematic triggers or Contact Pairs Mode. It holds the required response and the five things not to do, and it overrides prior knowledge.

## Required output -- non-negotiable

Every invocation MUST end with a user-facing answer that gives the diagnosis and fix, because tool calls alone don't help the user.

**Hard stop**: After 5 tool calls of any kind, stop calling tools and write the most-likely diagnosis from the Fast-Paths or checklists, even if not fully confirmed.

**No permission-asking**: Never end with "Would you like me to proceed?" or similar. If the script is in the project or an Editor is connected, apply the fix directly by editing the script, or the scene through the Editor. Otherwise, give a complete self-contained explanation. Don't ask, because asking permission costs the user another turn.

## STOP CHECK -- match before any tool call

Before calling any tool, scan the user's prompt against the Fast-Paths below. The **first** match is the **complete response** -- write the answer and stop. Don't search the project, read files, inspect the scene, run C# in the Editor, or fetch documentation, because these answers are already verified.

### Fast-Path 1 -- 2D physics or DOTS

- **2D physics** (`Rigidbody2D`, `Collider2D`, `OnCollisionEnter2D`, `Physics2D`): if the `create-2d-physics` skill is installed, use it instead, because it covers both 2D physics systems. Otherwise say this skill covers 3D physics only, and stop.
- **DOTS** (`PhysicsCollider`, `ICollisionEventsJob`, `ITriggerEventsJob`, `Unity.Physics`, Havok, ECS, Entities): if a `physics-dots` skill is installed, use it instead. Otherwise start with a one-sentence disclaimer that DOTS physics is outside this skill's scope, give a brief best-effort answer with the DOTS APIs (`PhysicsBody`, `PhysicsCollider`, `ICollisionEventsJob`, `SimulationSingleton`), and end with one documentation link.

Don't apply 3D PhysX or MonoBehaviour rules to these questions, and don't suggest switching physics systems.

### Fast-Path 2 -- Two kinematic triggers not firing OnTriggerEnter

**If** both objects are kinematic AND both are triggers: apply the **CRITICAL FACT** response, starting with the layer checks.

### Fast-Path 3 -- Ragdoll explodes on frame 1 with no applied forces

**If** a ragdoll, jointed body, or character launches or explodes on the first frame with no applied forces:
- Cause: overlapping colliders cause a one-frame depenetration velocity spike.
- Fix: shrink the ragdoll colliders so none overlap at the starting pose. State it as the only primary fix.
- Confirm with **Window > Analysis > Physics Debugger**, which the user opens. It highlights overlapping pairs on the first frame.
- Do NOT list joint limits, joint projection, joint configuration, joint types, mass ratios, or drive parameters as causes, even when the prompt mentions them, because they don't cause this symptom.
- Do NOT recommend disabling `Enable Collision` on the joint as the primary fix, because it hides the overlap rather than removing it.

### Fast-Path 4 -- CharacterController + OnCollisionEnter not firing

**If** the moving object has a `CharacterController` and the user expects `OnCollisionEnter`:
- `OnCollisionEnter` never fires for movement by `CharacterController.Move()`. Use `OnControllerColliderHit(ControllerColliderHit hit)` instead.
- Do NOT suggest adding a `Rigidbody`, because a `CharacterController` and a `Rigidbody` on the same object fight over its movement.

### Fast-Path 5 -- AddForce stopped working after object settled

**If** `AddForce` or `AddTorque` stopped working after the object landed or stopped:
- Cause: the Rigidbody fell asleep.
- Fix: call `Rigidbody.WakeUp()` before `AddForce`. Apply the code edit directly, and don't change the Input System or other unrelated code.

### Fast-Path 6 -- All physics frozen but raycasts still work

**If** callbacks have stopped and forces and gravity have no effect, but `Physics.Raycast` still hits: `Time.timeScale` is `0`. Restore it to `1f`, typically in the pause menu or cutscene controller.

### Fast-Path 7 -- Raycast origin inside the target collider

**If** `Physics.Raycast` returns false and the ray starts inside the target: read the notes on the [Physics.Raycast](https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unityengine/physics/raycast.md) page, then move the origin outside the collider. Don't suggest **Queries Hit Backfaces**, because it doesn't fix this case.

### Fast-Path 8 -- Raycast misses inactive GameObject or disabled Collider

**If** the target GameObject is inactive or its Collider is disabled: raycasts ignore it. Make sure `gameObject.activeInHierarchy` and `Collider.enabled` are both true before raycasting.

### Fast-Path 9 -- Raycast misses a trigger

**If** `Physics.Raycast` doesn't detect a trigger collider: pass `QueryTriggerInteraction.Collide` in that call, because it overrides **Queries Hit Triggers**. See [QueryTriggerInteraction](https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unityengine/querytriggerinteraction.md) and the [Physics settings](https://docs.unity.com/en-us/engine/<VERSION>/manual/unity-editor/editor-settings-reference/comp-manager-group/class-physics-manager.md).

### Fast-Path 10 -- IgnoreLayerCollision suppression persisting across scenes

**If** `Physics.IgnoreLayerCollision` suppresses collisions unexpectedly or across scenes: recommend the **Layer Collision Matrix** (**Edit > Project Settings > Physics**) first, because it's explicit and doesn't depend on runtime calls. As a code-only fallback, call `Physics.IgnoreLayerCollision(layerA, layerB, false)` at scene load.

## Tool budget

For cases not covered by the Fast-Paths: **at most 5 tool calls before committing to an answer**. Don't run C# in the Editor or fetch documentation to re-check rules this skill states, because they're already verified.

## Identify your symptom

Read the reference file that matches the user's symptom:

- [Collision checklist](references/collision-checklist.md) - read when `OnCollisionEnter`, `Stay`, or `Exit` doesn't fire or objects pass through each other. Step 10 covers collisions that fail only at speed.
- [Trigger checklist](references/trigger-checklist.md) - read when `OnTriggerEnter`, `Stay`, or `Exit` doesn't fire. It checks Is Trigger, the Rigidbody rule, layers, the callback signature and location, and non-convex mesh triggers.
- [Raycast checklist](references/raycast-checklist.md) - read when `Physics.Raycast` misses an object. It checks the LayerMask, non-convex mesh colliders, back faces, and UI targets.
- [Other symptoms](references/other-symptoms.md) - read when physics works in the Editor but not in a build, a moved collider isn't seen until the next step, there's a visible gap before contact, or a body stops responding.
- [Collision debugger](references/collision-debugger.md) - read when the user asks to see which contacts physics reports, or the checklists don't confirm a cause. It records contacts in the Editor without adding anything to the scene, and you delete it afterwards.

## Console errors

Read [console-errors-table.md](references/console-errors-table.md) when the Console shows a physics error, such as a concave MeshCollider message or a contact offset error. Each row maps the error text to its root cause and fix, and Unity creates no physics shape for the collider until you fix it.

## Final step

Run these checks in order. If any check fails, reread the [docs pages](#full-topic-map) to find out what you missed, fix it, and run the checks again.

1. Use `console_status` to check the project has zero console errors.
2. If the user didn't ask for proof and you don't suspect a fault, stop here.
3. Otherwise, enter Play mode once and reproduce the case. Read the outcome the user asked for through `eval`, such as whether the bullet's Rigidbody position stopped at the wall, not just the field you changed. Don't add logging or take screenshots, because they cost time and leave changes behind.
4. Exit Play mode and check again that the console has zero errors.

## Final report

Give the user a short checklist of what you did and why. List any side effects, such as a project setting you changed or a temporary script you added and removed. If the user needs to follow up with more steps or decisions, list them. For example:

```
I made the following changes:

[✓] Set the bullet Rigidbody's Collision Detection to Continuous Speculative, because it moved far enough in one physics step to pass through the wall.

Follow these steps to see the effect:

1. Enter Play mode and fire at the wall.
2. Check the bullet stops at the wall instead of passing through it.
```
