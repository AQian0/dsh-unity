# C# (Only When Requested)

- Use fully qualified UI types to avoid namespace conflicts
- Use `[SerializeField]` for inspector references
- Cache component references in Awake()
- Use events/delegates for button callbacks
- Place scripts in same folder as prefabs (follow project patterns)

**Component references:**
- Verify referenced objects exist before accessing them
- Handle cases where serialized references may be null
- When wiring up references, confirm the target component is present
