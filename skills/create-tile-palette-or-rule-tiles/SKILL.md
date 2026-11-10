---
name: create-tile-palette-or-rule-tiles
description: Creates a 2D tile palette from sprites or textures, or makes tiles change based on their neighbours. Use when the user wants a tile palette or tiles that connect to their neighbours as they paint, even when they don't name them.
required_packages:
  com.unity.2d.tilemap: ">=1.0.0"
  com.unity.2d.tilemap.extras: ">=4.0.0"
---

# Create tile palettes and RuleTiles

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Before making changes, establish a baseline of the current behavior so you can tell whether a later result is actually caused by your change.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for. See [Final step](#final-step).
- Avoid long explanations.

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](references/docs-and-api-lookup.md) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

Prefer fetching the page directly (for example `WebFetch`) over searching (for example `WebSearch`) — faster and lands on the exact reference. Only fetch what you need, and only search if you don't have the exact URL.

[references/docs-and-api-lookup.md](references/docs-and-api-lookup.md) is where the pages live: the full topic map (tile palette, Tile Palette window reference, Rule Tile, and whether to read the install's local html/markdown or the online page), the `<VERSION>` substitution rule for each docs host, and the API lookup steps — the `xrefmap.yml` grep workflow that turns a package or Engine class into its page.

## Glossary

The reference files write RuleTile rules as 3x3 text grids, read from the top row to the bottom row:

| Symbol | Meaning | In the API | In the Rule Tile Inspector |
|--------|---------|------------|----------------------------|
| `.` | The neighbour must be this RuleTile | `RuleTile.TilingRuleOutput.Neighbor.This` | Green arrow |
| `X` | Any neighbour (don't care) | Position left out of `m_Neighbors` and `m_NeighborPositions` | Empty cell |
| `*` | The tile itself | Not stored | Centre cell |

Don't read `X` as `NotThis`, because the Inspector draws `NotThis` as a red X, which means the opposite: the neighbour must not be this RuleTile.

## Workflow

Pick the matching reference doc based on what the user wants, then follow it:

- **Tile Palette** — [references/palette-create.md](references/palette-create.md) — when the user wants to organize tiles for 2D level design or create a new rectangular, hexagonal, isometric, or isometric Z as Y grid layout.
- **Blank/empty RuleTile** (no sprites provided) — [references/ruletile-createempty.md](references/ruletile-createempty.md) — when the user wants a blank RuleTile (rectangular grid), HexagonalRuleTile, or IsometricRuleTile for custom rule configuration and has not provided or referenced any sprites.
- **RuleTile built from existing sprites** (sprites, terrain art, edge tiles provided) — [references/ruletile-createfromsegment.md](references/ruletile-createfromsegment.md) — when the user wants tiles that autotile as they paint, or a RuleTile built from existing terrain or edge sprites so tiles connect correctly.

## Final step

Do the following checks:

1. Check the project has zero console errors. Use `console_status` for counts.
2. Read the assets back with `eval` (fully qualified), because an asset can exist without its settings having stuck:
   - If you created a tile palette, check that `AssetDatabase.LoadAllAssetsAtPath` on the palette returns a `GridPalette` sub-asset, and that the `Grid` on the palette's root GameObject has the `cellLayout` and `cellSize` you chose.
   - If you created a RuleTile, check that `AssetDatabase.LoadAssetAtPath` with the RuleTile type you created returns the asset, that `m_TilingRules.Count` equals the number of rules you created, and that each rule's `m_Sprites` has exactly one entry: `null` for an empty RuleTile, or the assigned sprite for one built from sprites.
3. If you built a RuleTile from sprites, check that it picks the right sprite as it's painted, because correct fields don't prove the rules match the art. Open a temporary scene with `EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Additive)`, add a Grid with a Tilemap, use `Tilemap.SetTile` to paint a 3x3 block of the RuleTile, and check that `Tilemap.GetSprite` at each cell returns the sprite of the rule that matches that cell's neighbours. For example, the centre cell gets the fully surrounded rule's sprite, if the RuleTile has that rule. Then close the scene with `EditorSceneManager.CloseScene(scene, true)` without saving it.
4. If a value doesn't match, fix the asset and repeat the check.
5. Stop there unless the user asked you to prove it works or you suspect a specific fault. If you do enter Play mode, do it once only to chase a fault you already suspect. Read the world through `eval` rather than adding logging. Take no screenshots, because they take too much time.

If a check fails, go back and reread the [docs pages](references/docs-and-api-lookup.md) to find out what you missed.

## Final report

Report the following, in order:

1. What changed: each asset you created, with its path and type, and the settings you used (grid type, cell size, sort axis, or number of tiling rules).
2. Side effects: any other file or scene you created or changed, such as an editor script copied from `scripts/` into `Assets`, so the user can remove it.
3. The verification results from the final step.
4. Follow-up the user must do, such as assigning sprites to an empty RuleTile or adding the RuleTile to a tile palette.
