---
name: sprite-segment-3x3grid
description: Segments a Sprite texture into a 3x3 grid and outputs a pattern of cells matching the center cell's color. Use when asked to analyze, compare, or document a sprite's structure or color distribution.
---
# Sprite Color Grid Analysis

Segment a sprite's texture into a 3x3 grid and output a text pattern showing which cells match the center cell's majority color.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Don't use `using` directives or unqualified types in the `snippet` for `eval`. The compiler reads using `UnityEngine` and a bare AssetDatabase, Volume, or Object causes errors (CS0246 / CS0103 / CS0104). `return` what you want to read; it arrives at `data.result.result`.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for. See [Final step](#final-step).
- Avoid long explanations.
- This skill reads a sprite and reports a pattern, so don't edit the user's files unless they ask. If they do, create the restore point just before the first edit.

## Step 1

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

## Full topic map

Documentation pages and API entry points: [references/topic-map.md](references/topic-map.md).
## Step 2. Procedure

1. Get the Unity version from `ProjectSettings/ProjectVersion.txt`, the sprite to analyze, and the match threshold. If there's no project or no version, assume Unity 6000.0, say so in your answer, and carry on. If the user gives no threshold, use the default from [Match Threshold](#match-threshold). If the user names no sprite, ask for it.
2. Read the [documentation pages](#full-topic-map) for what you're about to do.
3. Run the [Algorithm](#algorithm) on the sprite, following the [Implementation Guidance](#implementation-guidance). Use [scripts/SpriteGridAnalysis.cs](scripts/SpriteGridAnalysis.cs) as the code template. If you can't read the sprite's pixels (for example, there's no project), say so, explain how you'd calculate each cell, and carry on to the report.
4. Check the result against the [Output Format](#output-format): one line, three groups of three symbols separated by ` / `, with `*` in the center. If it doesn't match, reread the [documentation pages](#full-topic-map) and the [Algorithm](#algorithm), and run the analysis again.
5. If you changed the project or ran code in the Editor, run the checks in the [Final step](#final-step).
6. Report the result as described in the [Final report](#final-report).

## Parameters

### Match Threshold

The **match threshold** determines what percentage of pixels in a non-center cell must match the center's majority color for you to mark that cell as a match (`.`).

| Threshold | Description | Use Case |
|-----------|-------------|----------|
| **50%** | At least half the cell's pixels match center color | Lenient matching for sprites with mixed regions |
| **75%** | At least three-quarters match center color | Moderate matching for mostly solid regions |
| **90%** | Nearly all pixels must match center color | Strict matching for very uniform sprites |

**Default**: 75%

## Algorithm

1. **Segment the Sprite**: Divide the Sprite's texture region into a 3x3 grid (9 cells total)
2. **Identify Center Color**: Calculate the majority (most frequent) color in the center cell (position [1,1])
3. **Compare Each Cell**: For each of the 8 surrounding cells, calculate what percentage of pixels match the center's majority color. If the percentage meets or exceeds the **match threshold**, the cell is a match (`.`); otherwise it is not (`X`)
4. **Generate Output**: Create a text representation using the legend below

## Output Legend

`X` = cell does not meet the match threshold, `.` = it does, `*` = the center cell.

## Output Format

One line, three groups of three characters separated by ` / `, top-to-bottom rows and
left-to-right within a row: `[TopRow] / [MiddleRow] / [BottomRow]`, with each row written
`[Left] [Center] [Right]`. The grid-position mapping and worked examples are in
[output-format.md](references/output-format.md).

## Implementation Guidance

### Calculating Center's Majority Color

For the center cell:
1. Sample all pixels within the cell's bounds
2. Group pixels by color (consider using a color tolerance threshold for similar colors)
3. The majority color is the color with the highest pixel count
4. For tie-breaking, use the first color encountered

### Matching Non-Center Cells

For each of the 8 surrounding cells:
1. Count the total number of pixels in the cell
2. Count how many pixels match the center's majority color (using color tolerance)
3. Calculate the match percentage: `matchingPixels / totalPixels`
4. If match percentage >= threshold, cell is a match (`.`); otherwise (`X`)

### Color Tolerance

When comparing pixel colors:
- Consider using a tolerance threshold (e.g., RGB distance < 10) for "matching"
- Alternatively, for sprites with limited palettes, exact matching may be appropriate
- Account for alpha channel if relevant to the use case

### Sprite Bounds

Use the Sprite's `rect` property to determine the pixel region to analyze:
- `sprite.rect.x`, `sprite.rect.y` for the origin
- `sprite.rect.width`, `sprite.rect.height` for dimensions
- Divide width and height by 3 to get cell dimensions

## Notes

- The analysis works best with sprites that have distinct color regions; increase the color
  tolerance for gradients or many colors.
- Flip the y-axis from Unity's texture coordinates so the output runs top to bottom.
- Treat transparent pixels as a distinct color, or ignore them, depending on the use case.

The worked final-report example is in [notes.md](references/notes.md#worked-example).
## Final step

Do the following checks:

1. Check the project has zero console errors. Use `console_status` for counts.
2. Stop there unless the user asked you to prove it works or you suspect a specific fault.

If a check fails, go back and reread the [docs pages](#full-topic-map) to find out what you missed.

## Final report

Give the user a concise but not dense checklist of what you did and why, including any incidental side effects (for example, settings you toggled to test something, or temporary files you created). If the user needs to follow up with more steps or decisions, list them. For example:

A worked example is in [notes.md](references/notes.md#worked-example).
