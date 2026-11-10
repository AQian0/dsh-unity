# Canvas setup

```
Canvas (Screen Space - Overlay or Camera)
├── CanvasScaler (Scale With Screen Size recommended)
├── GraphicRaycaster
└── [UI Content]
```

**CanvasScaler settings:**
- Default to UI Scale Mode "Scale With Screen Size" unless the project has a specific reason for "Constant Pixel Size" (e.g., pixel-art, fixed-resolution targets)
- Reference Resolution: Match project standards (e.g., 1920x1080)
- When creating a Canvas with Screen Space - Camera, **read the camera's reference resolution** first
- Match Width Or Height: 0.5 (balanced)
- If an existing Canvas uses "Constant Pixel Size", flag it and ask the user before changing
- Prefer anchors and Layout Groups over absolute pixel positions for layout
