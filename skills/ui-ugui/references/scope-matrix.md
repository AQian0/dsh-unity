# Scope: what each request asks for

| Request Type | Action |
|--------------|--------|
| Question about UI | **Understand** — analyze hierarchy, explain structure |
| Change specific element | **Edit** — targeted modification only |
| Create new UI | **Generate** — create new hierarchy |
| Fix/improve existing UI | **Edit** — modify existing, don't rebuild |

**Generate only what is requested:**

| Request | Output |
|---------|--------|
| UI layout | Prefab or scene hierarchy only |
| "with code" / "with logic" / "functional" | Hierarchy + scripts |

**These do NOT imply scripts:**
- "proper buttons" → well-configured Button components
- "working UI" → valid hierarchy that renders
- "menu screen" → visual layout only
