# Console errors

If the user's Console shows one of these errors, apply the fix in its row, because Unity creates no physics shape for the collider (or keeps the old value) until the cause is fixed.

| Error text | Root cause | Fix |
|---|---|---|
| "Concave Mesh Colliders are not supported when used with dynamic Rigidbody GameObjects" | A non-convex MeshCollider on a non-kinematic Rigidbody, so the object falls through other colliders and raycasts miss it. | Enable **Convex** on the MeshCollider. Otherwise, if the convex hull is too coarse, replace it with compound primitive colliders. |
| "Concave Mesh Colliders are not supported when used with the Is Trigger option enabled" | A non-convex MeshCollider with **Is Trigger** on, so the trigger never fires. | Enable **Convex** on the MeshCollider. |
| "Contact offset must be greater than zero" | A script or the Inspector set `contactOffset` to `0` or less, and Unity kept the old value. | Set a small positive value, such as `0.001`. |
