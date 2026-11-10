# Entering an existing project mid-flow

The references assume an **art bible** (style statement + fixed palette) and, where audio meets
UI, the **mixer handshake** (exposed params `MusicVol`/`SFXVol`). On an existing project, run
these in order before the asked-for floor:

1. **Restore point** — confirm a clean commit to roll back to, or create one, before any change.
2. **Render pipeline** — read `GraphicsSettings.currentRenderPipeline`: the look floors' verifies
   are written for URP; on Built-in or HDRP, apply the opinions, name the pipeline gap, and skip
   the URP-typed checks.
3. **Art bible** — look for a `Palette` type or an art-bible note (AGENTS.md or CLAUDE.md, docs); if none
   exists, write the three-line bible from the game's current look first — retro-tinting later is
   the expensive order.
4. **Identity (live floor only)** — verify player identity with a live probe (services
   initialized and a PlayerId present), never by assuming an earlier setup step ran.
5. **Scope the done gate** to the surface you touched: a title-screen session scores the shell
   and look axes, not the whole board.

**A floor fills an engine default, never a developer's choice.** If the project already has its
own controller, camera, shader, palette or style, keep it, apply only the floor's opinions that
don't conflict, and name the difference in the report. Write an art bible only from choices the
developer has made, and ask before adding one mid-project.

