---
name: ui-ugui
description: Understands, edits, and generates Unity uGUI Canvas hierarchies, RectTransforms, Layout Groups, and prefab UI. Use for requests involving Canvas, uGUI, RectTransform, or prefab UI files.
---

Understand existing Unity uGUI, make targeted edits, and generate new Canvas-based hierarchies.

When working with ScrollRect/ScrollView, read the reference file:
- [references/scrollview-setup.md](references/scrollview-setup.md) — Required hierarchy, setup rules, and common failures

## Scope

Determine what the user is asking for, and generate only what is requested: [scope-matrix.md](references/scope-matrix.md) maps each request type to its output and lists what does not imply scripts.

## Critical Rules

**Namespace disambiguation:**
- Always use fully qualified type names when creating or referencing UI components
- `UnityEngine.UI.Image`, not `Image`
- `UnityEngine.UI.Button`, not `Button`
- Other namespaces in the project can cause ambiguous type errors

**Verify before modifying:**
- Always check what exists before making changes
- Confirm parent objects exist before adding children
- Verify components are present before modifying properties
- Never assume hierarchy state — query it first

**Incremental fixes over rebuilds:**
- When fixing issues, make targeted corrections
- Never destroy and recreate entire hierarchies to fix problems — destroyed objects cause null reference cascades
- Prefer identifying the specific broken property and fixing only that over rewriting large sections
- **When a fix fails, revert the change** before trying an alternative approach

**One change at a time:**
- Make a single change, then verify the result
- Do not batch multiple unrelated modifications
- Be careful not to inadvertently modify or remove adjacent elements when editing a specific one
- If something fails, understand why before trying alternatives
- Avoid "shotgun debugging" with multiple simultaneous changes

**Color and visibility:**
- **Ensure text is readable by default:** When choosing colors, ensure text contrasts with its background — but respect intentional low-contrast uses (disabled states, placeholder text, decorative elements)
- **Check visibility for new elements:** After creating UI elements, verify they have non-zero size and are within parent bounds. Elements intentionally created hidden (for later toggling, animation, etc.) are fine

**Specification adherence:**
- **Honor user specifications exactly:** When the user provides pixel dimensions, hex colors, positions, spacing, or other exact values, apply them precisely — do not approximate or substitute
- **Minimize unrelated changes:** When editing, avoid changing properties the user didn't ask about unless a related adjustment is necessary for the fix to work

## Conventions

**Follow project patterns first.** Search existing files before applying defaults.

| Type | Convention | Good | Bad |
|------|------------|------|-----|
| GameObject names | PascalCase | `SubmitButton` | `submit-button` |
| Prefab paths | Feature folders | `Assets/UI/Inventory/` | `Assets/Prefabs/UI/` |

## Workflow

1. **Verify state** — Check what exists in the scene/hierarchy before any action.
2. **Analyze** — Determine exactly what's needed. No extras.
3. **Search** — Find existing prefabs, canvases, assets. Don't assume paths.
4. **Follow project patterns** — Match folder structure and naming.
5. **Create or edit** — Build structure with proper anchoring, or make targeted edits.
6. **Confirm result** — Verify the change worked before moving on.

## Canvas Setup

Every UI needs a Canvas:

```
Canvas (Screen Space - Overlay or Camera)
├── CanvasScaler (Scale With Screen Size recommended)
├── GraphicRaycaster
└── [UI Content]
```

Prefer anchors and Layout Groups over absolute pixel positions. The CanvasScaler settings, including the Scale With Screen Size default and the reference-resolution rules, are in [canvas-setup.md](references/canvas-setup.md).

## Layout and anchoring

Layout Groups, Layout Elements, and RectTransform anchoring: [references/layout-and-anchors.md](references/layout-and-anchors.md).

## Common Components

The component-to-use-case table is in [common-components.md](references/common-components.md).

## Best Practices

- Use TextMeshPro for all text (not legacy Text)
- WorldSpace UI that have text should also use Text Mesh Pro, be sure to review the project and import the TMP essentials if they are not present in the project
- If the TextMeshPro Essentials were imported be sure to close the TMP Importer Windows and the Import Unity Package Window once the assets are imported
**Never use** `EditorApplication.ExecuteMenuItem("Window/TextMeshPro/Import TMP Essential Resources")`, unless the user asks for an interactive TMP Essentials installation. It opens a modal dialog that blocks whatever invoked it until a human dismisses it.

**Do not use** `AssetDatabase.ImportPackage()` for TMP resources, instead `TMP_PackageResourceImporter.ImportResources()` is the canonical non-interactive API.

Hierarchy organization and performance habits: [best-practices.md](references/best-practices.md).

## Interaction Readiness

Before completing any UI that contains interactive elements, verify:

1. **EventSystem** must exist in the scene (exactly one)
2. **GraphicRaycaster** must be on the Canvas
3. **Raycast Target = true** on interactive elements (and false on non-interactive ones to avoid blocking)
4. **Button.onClick should be wired** (via inspector or script) — only when scripts or logic were requested

If the first three are missing, interactive elements will exist visually but fail silently.

## Understanding

Read the hierarchy first, don't assume, and inspect the scene or prefab before answering. The structure checklist and the question-to-answer guide are in [understanding.md](references/understanding.md).

## Editing

For targeted changes: read before editing, verify the target object exists, identify the specific property or component, make the minimal change, and verify the result. **Never destroy to fix**: destroying objects cascades to null references elsewhere, so fix properties in place, and if an element must be removed, update all references first.

## C# (Only When Requested)

Use fully qualified UI types, `[SerializeField]` for inspector references, cache components in `Awake()`, and place scripts beside the prefabs. Patterns and the component-reference checks are in [csharp-scripts.md](references/csharp-scripts.md).

## Error Recovery

When something goes wrong, **stop and diagnose**: identify the exact error or symptom and its root cause before attempting fixes, and do not make speculative changes. **Fix incrementally**: one issue at a time, verifying each. **Avoid destructive patterns**: "start fresh" strategies destroy working elements along with broken ones, and rebuilding entire hierarchies creates more problems than it solves, so prefer surgical fixes. When stuck, re-verify the hierarchy, check whether previous changes were actually applied, and consider whether the approach itself is wrong. Full detail: [error-recovery.md](references/error-recovery.md).
