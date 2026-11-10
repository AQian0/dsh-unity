# Screen capture from the Editor

Capture a view to a PNG to check a visual result.

```bash
unity command capture game_view --output-path Screenshots/hud.png   # what the Game window shows, incl. overlay UI
unity command capture scene_view --max-resolution 512             # the scene only (camera render), inline, longest edge capped
unity command capture scene_view --source screen --output-path Screenshots/scene.png   # the Scene window with grid, gizmos, toolbars
unity command capture editor_window --window Inspector --output-path Screenshots/inspector.png   # any open Editor window
```

Without `--output-path` the image comes back inline (base64); `--include-inline-image true` gives
both. A relative path resolves from the project root (no `.meta` outside `Assets/`). `game_view`
opens a Game view if none is showing, in batchmode too. `game_view --source camera --camera <name>`
renders one camera; overlay UI is drawn on URP/HDRP (`--overlay auto|true|false`), not on Built-in.
`editor_window` and `scene_view --source screen` briefly front a background tab and don't work in
batchmode. `capture screenshot` is deprecated. On 6000.7+, `capture editor_element` /
`runtime_element` capture one UI Toolkit element by `--selector`.

