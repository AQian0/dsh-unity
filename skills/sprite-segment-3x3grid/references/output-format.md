# Output legend and format

| Symbol | Meaning |
|--------|---------|
| `X` | Cell does NOT meet the match threshold (insufficient pixels match center color) |
| `.` | Cell MEETS the match threshold (enough pixels match center color) |
| `*` | The center cell itself (always position [1,1] in the grid) |

## Output Format

Output a single line with three groups of three characters, separated by ` / `. Each group represents one row of the grid.

**Order**: Top to Bottom rows, Left to Right within each row.

**Format**: `[TopRow] / [MiddleRow] / [BottomRow]`

Each row contains 3 characters separated by spaces: `[Left] [Center] [Right]`

### Grid Position Mapping

```
Grid Layout:        Output Order:
[0,0] [1,0] [2,0]   1  2  3   -> First group
[0,1] [1,1] [2,1]   4  5  6   -> Second group (5 is always *)
[0,2] [1,2] [2,2]   7  8  9   -> Third group
```

### Examples

**Example 1**: Center matches top-left and bottom-right only
```
. X X / X * X / X X .
```
Grid interpretation:
```
.  X  X
X  *  X
X  X  .
```

**Example 2**: Center matches all surrounding cells
```
. . . / . * . / . . .
```

**Example 3**: Center matches none of the surrounding cells
```
X X X / X * X / X X X
```

**Example 4**: Center matches bottom row only
```
X X X / X * X / . . .
```

