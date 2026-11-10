# The Defaults table

> Reference for the `new-unity-project` skill. Every row reverses on a word; change a row only with
> a run-earned receipt. Step 1 fills the brief's gaps from here, Step 2 prints these as the
> assumptions manifest, and Step 3 reconciles the create result against them.

| Decision | Paved opinion |
|---|---|
| Editor version | `--editor-version latest`, explicit |
| Template | URP; 3D unless the prompt says 2D (`--template 3d` or `2d`) |
| Platforms | Desktop only; add modules when the prompt implies them ("mobile game" → ios/android) |
| Monetization | None at creation; noted for later |
| Version control | Local git + Unity .gitignore |
| Player identity | Anonymous accounts — create's when its result shows them, else wired in Step 6 |
| Craft floors | Always on, via the `craft-game-floors` skill: look, camera, lighting, feedback, audio, shell, live floor, done gate |

Cloud link and diagnostics are **not** a row: create applies its own defaults — narrate them from
the result, don't re-decide.
