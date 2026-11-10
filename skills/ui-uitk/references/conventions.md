# Conventions

| Type | Convention | Good | Bad |
|------|------------|------|-----|
| `name` attribute | camelCase | `submitButton` | `submit-button` |
| `class` attribute / USS | kebab-case | `.submit-button` | `.submitButton` |
| File paths | Feature folders | `Assets/UI/Inventory/` | `Assets/Scripts/UI/` |

**Output format:**
```uxml Filename.uxml
<ui:UXML>...</ui:UXML>
```
```uss Filename.uss
.class { ... }
```

## Explaining structure

When explaining UI structure, use this format:
```
```
[ElementType] name="elementName" class="class1 class2"
├── [ChildType] name="childName"
│   └── [GrandchildType]
└── [ChildType] class="another-class"
```
```
