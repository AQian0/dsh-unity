# Identify your symptom

Read the reference file that matches the user's symptom:

- [Collision checklist](collision-checklist.md) - read when `OnCollisionEnter`, `Stay`, or `Exit` doesn't fire or objects pass through each other. Step 10 covers collisions that fail only at speed.
- [Trigger checklist](trigger-checklist.md) - read when `OnTriggerEnter`, `Stay`, or `Exit` doesn't fire. It checks Is Trigger, the Rigidbody rule, layers, the callback signature and location, and non-convex mesh triggers.
- [Raycast checklist](raycast-checklist.md) - read when `Physics.Raycast` misses an object. It checks the LayerMask, non-convex mesh colliders, back faces, and UI targets.
- [Other symptoms](other-symptoms.md) - read when physics works in the Editor but not in a build, a moved collider isn't seen until the next step, there's a visible gap before contact, or a body stops responding.
- [Collision debugger](collision-debugger.md) - read when the user asks to see which contacts physics reports, or the checklists don't confirm a cause. It records contacts in the Editor without adding anything to the scene, and you delete it afterwards.

## Console errors

Read [console-errors-table.md](console-errors-table.md) when the Console shows a physics error, such as a concave MeshCollider message or a contact offset error. Each row maps the error text to its root cause and fix, and Unity creates no physics shape for the collider until you fix it.
