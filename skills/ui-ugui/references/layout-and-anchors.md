# Layout Components

**Layout Groups control child sizing:**
- When a parent has a Layout Group, it manages child RectTransforms
- Children's anchors and sizeDelta may be overridden by the parent
- Understand whether the parent or child controls size before setting values

**Vertical/Horizontal Layout Groups:**
- Control Child Size: determines if parent sets child dimensions
- Child Force Expand: determines if children stretch to fill space
- If Control Child Size is off, children must have explicit sizes

**Avoiding layout conflicts:**
- Do not manually set child anchors/size when parent controls them
- Do not add Layout Group to an element that should have fixed size
- Nested Layout Groups require careful configuration of each level
- When layout is wrong, check parent settings before modifying child
- ContentSizeFitter on the **same** object as a Layout Group that has Control Child Size enabled = conflict
- ContentSizeFitter on a child whose parent has Control Child Size enabled = ContentSizeFitter is overridden (wasted)
- When using ContentSizeFitter with a Layout Group parent, disable Control Child Size on the parent for the relevant axis
- Common pattern: ScrollView Content should have ContentSizeFitter + VerticalLayoutGroup where VLG controls children but ContentSizeFitter sizes the Content itself

**Grid Layout Group:**
- For inventory grids, card layouts
- Cell Size must be set explicitly — children are sized to match
- Constraint controls row/column limits

**Content Size Fitter:**
- Horizontal/Vertical Fit: Preferred Size
- Use on containers that should size to their content
- Requires a layout element or text component to provide preferred size

# RectTransform Anchoring

**Elements must have non-zero size to be visible:**
- Set explicit width/height via sizeDelta, or
- Use stretch anchors with proper offsets, or
- Let a parent Layout Group control size (with Control Child Size enabled)

**Anchor configuration order:**
1. Set anchor preset first (corner, edge, or stretch)
2. Then set position/offset values
3. Verify the resulting size is non-zero

**Common patterns:**
- **Stretch anchors** — for responsive elements that fill available space
- **Corner anchors** — for fixed-position, fixed-size elements
- **Edge anchors** — for elements that stretch in one direction only

**Positioning from natural language descriptions:**
When the user describes a position (e.g., "top right", "bottom bar", "left side"):
1. Determine if it's a **corner** (fixed point), an **edge** (stretch along one axis), or **fill** (stretch both axes)
2. Set anchor min and anchor max — for corners these are the same point; for edges/fill they span a range
3. **Set pivot to match the anchor point** — pivot must align with where the element is anchored, not left at the default (0.5, 0.5). A "top right" element needs pivot at the top-right corner; a "top bar" needs pivot at the top edge center
4. Set position/offset values **after** anchors and pivot are configured

**Visibility checklist:**
- Width and height are both greater than zero
- Element is within parent bounds
- Element is not obscured by siblings (check hierarchy order)
- Image component has a sprite or color with alpha > 0
