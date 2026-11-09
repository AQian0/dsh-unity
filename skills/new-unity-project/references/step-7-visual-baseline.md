# Step 7 — Visual baseline

A fresh template renders correctly but looks like a default; left there, agents reach for `OnGUI`
and guess shader names. Apply this floor **before** any gameplay work. A `--bare` run skips this
whole step (no Pipeline install, no baseline): go to Step 8, which opens the project.

**On Unity 6000.5.0 to 6000.5.2, stop here.** The Pipeline package can't start its server on those
Editors (create reports `PIPELINE_EDITOR_UNSUPPORTED`), so nothing below can connect, and reopening
won't help. Create also left the package out on those Editors. Ask the user to update to
6000.5.3f1 or later, then continue below with the project still closed: the Pipeline install comes
first, then the open names the updated Editor, `unity open "<project-path>" --editor-version
<updated-version>` — a plain `unity open` reopens with the project's saved 6000.5.x Editor. If the
update is 6000.7 or later, `unity open` refuses that move (`PROJECT_UPGRADE_REQUIRED`): run
`unity projects upgrade "<project-path>" --to <updated-version> --yes` instead. It asks
nothing: add `--no-cloud` when the user declined the cloud link at create, since an unlinked
project otherwise exits `CLOUD_CHOICE_REQUIRED`, and no cloud flag when create linked it.

**First, `unity pipeline install --project-path "<project-path>"`, before opening the
Editor.** Running C# in the Editor and `unity command capture screenshot` below both need the
project's `com.unity.pipeline` package. Create adds it by default on newer CLIs (this install then
changes nothing); older CLIs leave the project without it, and Step 5's `-batchmode` installer
never touches it. Install-before-open is the supported order; without the package, everything below fails to
connect (it mimics `unity-cli`'s Safe Mode failure). The failure codes
(`PIPELINE_MANIFEST_WRITE_FAILED`, a stuck `STATUS_PIPELINE_LOAD_PENDING`) and the stuck-Editor
recovery are tabled in [references/skill-setup.md](../references/skill-setup.md).

**Then** `unity open "<project-path>"`, wait until `unity status` reports the Editor ready, and
apply each item below by running C# in it — **`unity-cli` owns those commands**; don't re-derive
them here.

Once the Editor is ready, read the `unity-pipeline` guide if your skills don't list it —
locations and mirroring routes: [references/skill-setup.md](../references/skill-setup.md).

**Items 1, 2, 5 and 6 assume a URP template**, the Step 2 default. If the user explicitly chose
Built-in, don't run them as written — `UniversalAdditionalCameraData`, `Light2D`, the
`urp-postprocessing` volume framework and `Universal Render Pipeline/*` shaders don't exist there;
post-processing means the legacy Post Processing Stack, the shader names are `Standard` /
`Unlit/Color`, and items 3–4 apply as written. Don't reach for `migrate-birp-to-urp` — the user
asked for Built-in.

1. **Post-processing.** Global Volume — `craft-game-floors`'s scene-lighting values when loaded (they
   supersede these); fallback: Tonemapping (ACES), Bloom intensity 0.5–1 @ threshold 0.9, Vignette
   ≈ 0.25; set `renderPostProcessing = true` on the main camera's `UniversalAdditionalCameraData`.
   **REQUIRED SUB-SKILL:** `urp-postprocessing` — its templates create the volume and check HDR and
   the layer mask; if it isn't loaded, do both yourself from these values.
2. **Camera and light.** 2D → orthographic, solid background from the brief's palette, a `Light2D`
   of type Global if the template scene has none (Sprite-Lit shaders render black without one).
   3D → perspective, main-light shadows on; `craft-game-floors`'s lighting pass replaces the template's
   default light story when loaded, else keep the template's directional light and skybox.
3. **Quality tier.** Read `QualitySettings.names` first — tier names differ per template — then
   `QualitySettings.SetQualityLevel` to the one matching the primary target: the highest tier for
   desktop, the lowest for mobile/WebGL. Leave color space Linear and the Input System as the
   template set them.
4. **UI stack.** HUD and menus use a uGUI Canvas + TextMeshPro or UI Toolkit — **never `OnGUI`**.
   **REQUIRED SUB-SKILL:** `ui` picks between them for the project. If it isn't loaded, choose
   between them from the brief and say which you chose, and why, in your final report.
5. **Materials and shaders.** Under URP use `Universal Render Pipeline/Lit`, `…/Unlit`,
   `…/2D/Sprite-Lit-Default` or `…/2D/Sprite-Unlit-Default`. `Standard` and `Unlit/Color` render
   pink or washed out under URP. Prefer `GraphicsSettings.currentRenderPipeline.defaultMaterial`
   / `.default2DMaterial` over `Shader.Find`, and treat a `null` from `Shader.Find` as an error.
   `currentRenderPipeline`, not `defaultRenderPipeline`: a quality tier can carry its own pipeline
   asset, and item 3 above just set the tier.
6. **Pixel art only.** Point filter mode on sprites and a Pixel Perfect Camera — see
   `2d-pixel-perfect`. If missing, do both yourself and note the skill-setup install route in the
   report.

Save the scene, then confirm both of these — **not with `unity logs`**, which reads the CLI's own
log and reports clean whatever the scene looks like:

- No render-pipeline or shader errors Editor-side. Read the Editor console through `unity-cli`,
  or read `Editor.log` directly — that skill's "Recovering from Safe Mode" section has the
  per-platform paths.
- `unity command capture screenshot --output-path baseline.png` looks lit and tonemapped rather than flat
  gray.

