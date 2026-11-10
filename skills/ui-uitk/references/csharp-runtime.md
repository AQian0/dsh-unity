# C# (Only When Requested)

- Style via USS classes (`AddToClassList()`) — never use `element.style.*` as inline styles have higher specificity than USS selectors, making them impossible to override via stylesheets, and add per-element memory overhead
- UITK uses TextCore text assets — use `FontAsset`, `TextStyleSheet`, and `TextSettings`, not their TextMeshPro equivalents (`TMP_FontAsset`, etc.)
- Place scripts in same folder as UXML/USS

