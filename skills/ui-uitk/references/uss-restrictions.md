# USS restrictions

Unity's USS is a subset of CSS. These properties do NOT exist — NEVER use them:

| NEVER Use | Use Instead |
|-----------|-------------|
| `border` shorthand | `border-width`, `border-color` separately |
| `gap` | `margin` on children |
| `z-index` | DOM order or parent nesting |
| `pointer-events` | `picking-mode` UXML attribute |
| `filter` | Not supported |
| `outline` | `border-*` properties |
| `box-shadow` | Nested elements or background image |
| `:first-child`, `:last-child`, `:nth-child` | Explicit classes |
| `[attribute]` selectors | Explicit classes |
| `transition-property: <value>` | Omit entirely, or `none`/`initial`/`inherit` only |
| `linear-gradient()`, `radial-gradient()` | Custom `VisualElement` with Painter2D (see `references/painter2d.md`) |

**Inline styles:** NEVER use `style="..."` in UXML. All styling in USS only.

**External URLs:** NEVER use `url()` with external paths. Only `url("project://database/Assets/...")`.

**Prefer flexible layouts over hardcoded sizes:**
- Use `flex-grow`, `flex-shrink`, or `%` instead of fixed `width`/`height` values
- Let elements flow naturally and be constrained by their parent container
- Set explicit pixel sizes only on root containers or when a fixed size is truly required
- Child elements should adapt to available space rather than define their own dimensions
