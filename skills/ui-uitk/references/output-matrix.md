# What to generate for each request

| Request | Output |
|---------|--------|
| USS only | `.uss` file only |
| UXML only | `.uxml` file only |
| UI screen / menu / panel | `.uss` + `.uxml` only |
| "with code" / "with logic" / "functional" | `.uss` + `.uxml` + `.cs` |

**These do NOT imply C#:**
- "proper buttons" → well-styled Button elements
- "currency display" → a Label element
- "working UI" → valid UXML/USS that renders
- "inventory screen" → visual layout only
- "inventory system" / "equipment system" / "crafting system" → Ask: "Should items be draggable?" If yes, see `references/pointermanipulator-guide.md` for patterns

