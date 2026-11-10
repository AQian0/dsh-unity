---
name: ui-uitk
description: Understands, edits, and generates Unity UI Toolkit UXML and USS with flex layouts. Use for requests involving UI Toolkit, UIElements, UIDocument, PanelSettings, custom elements, or UI runtime binding.
---

Understand existing Unity UI Toolkit code, make targeted edits, generate new UXML/USS files, Manipulators, and handle UI runtime binding.

## References

Read these as needed:
- [references/uss-guide.md](references/uss-guide.md) — USS patterns, examples, brevity rules
- [references/svg-icons.md](references/svg-icons.md) — icons, when generating them
- [references/common-issues.md](references/common-issues.md) — mistakes to avoid
- [references/ui-runtime-binding.md](references/ui-runtime-binding.md) — runtime data binding, when bindings are involved
- [references/painter2d.md](references/painter2d.md) — beyond USS: gradients, shapes, arcs, procedural drawing
- [references/pointermanipulator-guide.md](references/pointermanipulator-guide.md) — drag and drop, event handling
- [references/custom-elements.md](references/custom-elements.md) — reusable UXML + USS + C# components

## Understanding

When explaining UI structure, use the tree format in [conventions.md](references/conventions.md).

## Editing

**Don't over-edit:**
- Change only what's requested, and preserve formatting and structure
- Don't "improve" unrelated code, and don't add comments unless asked
- For targeted changes, prefer editing specific elements or selectors over rewriting whole files — but if a change touches most of the file, a rewrite may be cleaner
- Don't accidentally drop existing elements, styles, or references
- **When editing USS**, focus on the properties and selectors relevant to the request — avoid unnecessary reorganization, but restructure if the change genuinely requires it

The smallest edit for each common request is in [editing-recipes.md](references/editing-recipes.md).

## Validation

Unity parses UXML and USS on import and reports problems in the Console; nothing outside the Editor validates them, so write the files and have the user check.

**Workflow:**

1. Write the complete file to its target path; do not write partial or draft content, because a half-written UXML file is a parse error the moment the Editor picks it up.
2. Ask the user to focus the Unity Editor, which triggers a reimport.
3. Ask them to report anything in the Console: UXML parse errors name the file and line, USS problems appear as warnings about unknown properties or selectors.
4. Fix what they report and repeat from step 1.

**Because feedback costs a user round-trip, get it right the first time:** finish all files before asking, so one reimport covers everything; re-read `references/uss-guide.md` and `references/common-issues.md` before writing; and watch for mistakes that survive a parse but render wrong, since they never reach the Console (`references/common-issues.md` lists them).

## Generation

Generate only what is requested: [output-matrix.md](references/output-matrix.md) maps each request to its files, and [generation-rules.md](references/generation-rules.md) holds the styling and theme rules.

**Generation workflow:**
1. **Analyze, search, reuse** — the exact files needed, the existing USS/UXML/assets, and shared stylesheets; no extras, and don't assume paths. Follow the project's folder and naming patterns.
2. **Write USS first** — verify against the restrictions below.
3. **Write UXML** — reference the USS, verify structure.
4. **Write complete files** — never partial content; see Validation.
5. **Scene setup** — assign PanelSettings when adding UI to a scene.
6. **Data binding** — when requested, add the C# script with the `references/ui-runtime-binding.md` patterns plus the scriptable object asset if needed, and assign it to the UI element root in UXML or via datasource in C#.

**Color, visibility, and specification rules:**
- **Ensure text is readable by default:** text must contrast with its background, except for intentional low contrast such as disabled states, placeholder text, or decoration; with design tokens, check that text and background variables contrast adequately.
- **Honor exact values:** user-specified hex colors, pixel dimensions, and spacing are used exactly as given. Do not approximate or substitute.

## Conventions

**Follow project patterns first.** Search existing files before applying defaults. Naming, folder conventions and output format: [conventions.md](references/conventions.md).

## USS Restrictions

Unity's USS is a subset of CSS. These properties do NOT exist — **NEVER** use them: `border` shorthand, `gap`, `z-index`, `pointer-events`, `filter`, `outline`, `box-shadow`, `:first-child` / `:last-child` / `:nth-child` and `[attribute]` selectors, any `transition-property: <value>`, and `linear-gradient()` / `radial-gradient()`.

**NEVER** use `style="..."` in UXML — all styling in USS only. **NEVER** use `url()` with external paths, only `url("project://database/Assets/...")`.

**Prefer flexible layouts over hardcoded sizes:** use `flex-grow`, `flex-shrink`, or `%` instead of fixed `width`/`height`, reserving pixel sizes for root containers or a genuinely fixed size.

Keep USS brief: no default values or fonts, no redundant constraints, the simplest selector that works, never duplicate selectors (`references/uss-guide.md`). Replacements: [uss-restrictions.md](references/uss-restrictions.md).

## UXML

Every file must:
1. Declare namespace: `<ui:UXML xmlns:ui="UnityEngine.UIElements">`
2. Link stylesheet(s): `<ui:Style src="Screen.uss" />`
3. Have exactly one top-level container
4. **No `style="..."` attributes** — use USS only

Skeleton: [uxml-skeleton.md](references/uxml-skeleton.md).

## Events and Interactivity
- Use Pointer Manipulators for event handling and interactivity on a VisualElement (`references/pointermanipulator-guide.md`); for drag and drop, write a pointer Manipulator and attach it to the relevant element in UXML or via C#.
- For simple click events, use the `clickable` manipulator in UXML; for more advanced interactions, use traditional event callbacks in C#.
- For "inventory system", "equipment system" or "crafting system", ask "Should players be able to drag and drop items?", then use the inventory patterns in `references/pointermanipulator-guide.md` or create static layout only

## Assets

**Do NOT reference `UnityDefaultRuntimeTheme.tss`** or Unity's built-in theme icons.

Icon priority and the `project://database/` reference format are in [assets-and-icons.md](references/assets-and-icons.md).

## Scene Setup

**PanelSettings is required** — UI won't render without it. How to find or create and assign it: [scene-setup.md](references/scene-setup.md). Skip this for Editor UI (EditorWindow, PropertyDrawer).

## C# (Only When Requested)

Style via USS classes (`AddToClassList()`) — never use `element.style.*`: inline styles outrank USS selectors and cannot be overridden, and they add per-element memory. UITK uses TextCore text assets — `FontAsset`, `TextStyleSheet`, `TextSettings`, not the TextMeshPro equivalents. Place scripts beside the UXML/USS. See [csharp-runtime.md](references/csharp-runtime.md).
