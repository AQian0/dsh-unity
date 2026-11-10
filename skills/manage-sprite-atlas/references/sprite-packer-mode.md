# 2. SpritePacker Mode (REQUIRED)

**Enable Sprite Packer mode before creating atlases, then read the setting back and confirm it took.**
Use the code in [resources/enablespritepacking.cs](../resources/enablespritepacking.cs); it sets
`EditorSettings.spritePackerMode` and configures the importer's packing settings.

This is the step that decides whether the atlas you produce is real. `Disabled` is the zero value of
`SpritePackerMode`, so any project where nobody has set it carries packing **Disabled**, and an atlas
created while it is Disabled still imports, still shows up as an asset, and still looks finished, but
can never pack. Unity says so in the Inspector: *"Sprite Atlas packing is disabled"*. Nothing else in
the workflow fails, so an atlas shipped this way reads as a success. Do not assume a project is
already configured: read the value.

So do not treat "I set it" as done. After setting it, read `EditorSettings.spritePackerMode` back,
confirm it is **not** `Disabled`, and report the value you actually read. If you cannot read it back,
say so rather than assuming the write landed.


**DO NOT edit meta files DIRECTLY.**

