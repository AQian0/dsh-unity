# Notes

- This analysis works best with sprites that have distinct color regions
- For sprites with gradients or many colors, consider increasing color tolerance
- Flip the y-axis from Unity's texture coordinates so the output runs top to bottom
- Treat transparent pixels as a distinct "color", or ignore them, depending on the use case


## Worked example

```
I analyzed the `Rock_01` sprite with the default 75% match threshold:

. X X / X * X / X X .

[✓] Split the sprite's `rect` into a 3x3 grid.
[✓] Compared each cell with the center cell's majority color.

If you want a stricter or more lenient result, give me a threshold, for example 90% or 50%.
```
