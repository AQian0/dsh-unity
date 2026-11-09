# Unity skill audit

Audit of the packaged Unity skills against DeepSeek Harness skill rules.

- Generated: 2026-11-09T03:59:37.196Z
- Node: v26.13.0
- Skills directory: `/Users/aqian/dsh-unity/skills`
- Validator: `scripts/validate-skills.mjs` (`npm run validate`)

Discovery and loading are exercised through `createUnitySkillReader` from `lib/skills.js`
and frontmatter parsing through `parseSkillMarkdown` from `lib/frontmatter.js`, so the audit
measures what the harness itself would see.

## Summary

- Skills audited: **34**
- Passed: **34**; failed: **0**
- Failures: **0**; warnings: **0**
- Provider path: **34/34** candidates listed and **34/34** skills loaded
- Skill-relative references: **155/155** resolved on disk
- Informational non-standard frontmatter keys: **6** keys across **14** skills

## Checks

| Check | Result | Detail |
| --- | --- | --- |
| SKILL.md in every skill folder | pass | 34 folders |
| Frontmatter parses (`parseSkillMarkdown`) | pass | 34 skills |
| Name is kebab-case and matches folder | pass | 34 skills |
| Description non-empty and free of `<`/`>` | pass | 34 skills |
| Skill names unique | pass | 34 distinct names |
| Body non-empty | pass | 34 skills |
| Provider discovery (`list`) | pass | 34/34 candidates |
| Provider load (`load`) | pass | 34/34 loaded |
| Skill-relative references resolve | pass | 155/155 resolved |

## Skills

| Skill folder | Parsed name | Description chars | Extra frontmatter keys |
| --- | --- | --- | --- |
| `2d-pixel-perfect` | `2d-pixel-perfect` | 220 | — |
| `asset-transformer-toolkit` | `asset-transformer-toolkit` | 245 | `required_packages` |
| `audio-setup-mixers` | `audio-setup-mixers` | 222 | — |
| `build-gtk` | `build-gtk` | 243 | `required_editor_version` |
| `build-live-game` | `build-live-game` | 242 | — |
| `craft-game-floors` | `craft-game-floors` | 244 | `allowed-tools` |
| `create-2d-physics` | `create-2d-physics` | 206 | `allowed-tools`, `metadata` |
| `create-tile-palette-or-rule-tiles` | `create-tile-palette-or-rule-tiles` | 228 | `required_packages` |
| `fix-3d-physics-collisions` | `fix-3d-physics-collisions` | 226 | `required_editor_version` |
| `generate-editor-search-query` | `generate-editor-search-query` | 214 | `enabled`, `modes` |
| `implement-in-app-purchases` | `implement-in-app-purchases` | 305 | — |
| `initialize-ai-navigation` | `initialize-ai-navigation` | 200 | — |
| `levelplay-unity-integration` | `levelplay-unity-integration` | 271 | — |
| `localize-unity-project` | `localize-unity-project` | 149 | — |
| `manage-sprite-atlas` | `manage-sprite-atlas` | 187 | — |
| `migrate-birp-to-urp` | `migrate-birp-to-urp` | 198 | — |
| `new-unity-project` | `new-unity-project` | 210 | `allowed-tools` |
| `optimize-audio` | `optimize-audio` | 241 | — |
| `optimize-text-mesh-pro` | `optimize-text-mesh-pro` | 290 | — |
| `optimize-web` | `optimize-web` | 228 | — |
| `setup-multiplayer-services` | `setup-multiplayer-services` | 218 | — |
| `setup-vivox-voice-chat` | `setup-vivox-voice-chat` | 204 | `required_packages` |
| `shader-graph-create-custom-node` | `shader-graph-create-custom-node` | 159 | `required_packages` |
| `sprite-editor` | `sprite-editor` | 157 | `modes` |
| `sprite-segment-3x3grid` | `sprite-segment-3x3grid` | 198 | — |
| `ui` | `ui` | 240 | — |
| `ui-imgui` | `ui-imgui` | 183 | — |
| `ui-ugui` | `ui-ugui` | 186 | — |
| `ui-uitk` | `ui-uitk` | 200 | — |
| `unity-cli` | `unity-cli` | 227 | `allowed-tools` |
| `unity-package-management` | `unity-package-management` | 182 | `allowed-tools` |
| `unity-pipeline` | `unity-pipeline` | 148 | — |
| `urp-postprocessing` | `urp-postprocessing` | 178 | `required_packages` |
| `validate-urp-render-graph-renderer-feature` | `validate-urp-render-graph-renderer-feature` | 200 | — |

## Informational frontmatter keys

These keys are authored for the original Claude/Codex/Antigravity loaders. DSH reads `name`,
`description`, `whenToUse`, `disable-model-invocation`, and `user-invocable`; `metadata` is
forwarded as skill metadata; the remaining keys are tolerated and ignored. They are reported
for information and are **not** failures.

| Key | Skills using it |
| --- | --- |
| `allowed-tools` | `craft-game-floors`, `create-2d-physics`, `new-unity-project`, `unity-cli`, `unity-package-management` |
| `enabled` | `generate-editor-search-query` |
| `metadata` | `create-2d-physics` |
| `modes` | `generate-editor-search-query`, `sprite-editor` |
| `required_editor_version` | `build-gtk`, `fix-3d-physics-collisions` |
| `required_packages` | `asset-transformer-toolkit`, `create-tile-palette-or-rule-tiles`, `setup-vivox-voice-chat`, `shader-graph-create-custom-node`, `urp-postprocessing` |

## Warnings

None.

## Failures

None.

