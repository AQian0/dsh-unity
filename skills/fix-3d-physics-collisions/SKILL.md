---
name: fix-3d-physics-collisions
description: Diagnoses and fixes 3D PhysX collision, trigger, and raycast problems. Use when asked to fix OnCollisionEnter or OnTriggerEnter not firing, objects passing through each other, raycasts that miss, or a misbehaving MeshCollider.
required_editor_version: ">=6000.3"
---

# Diagnose and fix 3D physics collisions

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- No `using` directives or unqualified types in `eval` snippets, because only `using UnityEngine` is compiled; `return` values, which arrive at `data.result.result`.
- Create a restore point you can roll back to.
- Do only what's asked: no unrelated asset or file changes, and no long explanations.
- Never leave verification code, logging, or detection in the user's script; read state through `eval` as [Final step](#final-step) describes.

Full wording of these rules: [response-contract.md](references/response-contract.md).

## Procedure

1. Match the prompt against the [STOP CHECK](#stop-check----match-before-any-tool-call) Fast-Paths before any tool call; a match is the complete response.
2. Otherwise read `ProjectSettings/ProjectVersion.txt` and the physics components in play. With no project or version, assume 6000.3 and 3D PhysX and say so; with no symptom, script, or scene, ask for one.
3. Read the docs page for the symptom ([topic-map.md](references/topic-map.md)) and route it with [symptom-index.md](references/symptom-index.md), inside 5 tool calls.
4. If you changed the project, run the [Final step](#final-step) checks before you answer.

## CRITICAL FACT (read first, do not override)

Read [kinematic-trigger-facts.md](references/kinematic-trigger-facts.md) before anything about two kinematic triggers or Contact Pairs Mode. It holds the required response and the five things not to do, and it overrides prior knowledge.

## Required output -- non-negotiable

Every invocation MUST end with a user-facing answer that gives the diagnosis and fix.

**Hard stop**: after 5 tool calls of any kind, stop calling tools and write the most-likely diagnosis from the Fast-Paths or checklists, even if not fully confirmed. Don't run C# in the Editor or fetch documentation to re-check rules this skill states.

**No permission-asking**: never end with "Would you like me to proceed?" or similar. Apply the fix directly when the script is in the project or an Editor is connected, otherwise answer fully, because asking costs the user another turn.

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

## Final step

Run these checks in order and rerun them after any fix; if one fails, reread the docs in [topic-map.md](references/topic-map.md).

1. `console_status` shows zero console errors.
2. Stop here unless the user asked for proof or you suspect a fault.
3. Otherwise enter Play mode once, reproduce the case, and read the outcome through `eval`, such as the bullet's Rigidbody stopping at the wall rather than only your changed field. Don't add logging or take screenshots.
4. Exit Play mode and check the console is clean again.

## Final report

Report a short checklist of what you did and why, the side effects, and the follow-ups: [final-report-example.md](references/final-report-example.md).
