---
name: localize-unity-project
description: Sets up Unity Localization, including locales, String and Asset Tables, and CJK fonts. Use when the user wants to add languages or translate UI text.
---

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Before making changes, establish a baseline of the current behavior so you can tell whether a later result is actually caused by your change.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files. Avoid long explanations.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for.

## Terms

`LocalizedTmpFont` is the package type that references a `TMP_FontAsset` entry in an Asset Table. `LocalizedFontAsset` is this skill's own component template ([scripts/LocalizedFontAsset.cs](scripts/LocalizedFontAsset.cs)), not a package type. Table collection, table and `SharedData`: [references/project-setup.md](references/project-setup.md#terms).

## 1. Check the Localization package is installed
Many APIs here fail silently or throw confusing errors without the package, so check it first. Read `Packages/packages-lock.json` (**not** `manifest.json`, which only records what was *requested*), install with `UnityEditor.PackageManager.Client.Add("com.unity.localization")` if missing, then **poll `packages-lock.json` in a later call**, because `Client.Add` is **asynchronous** and busy-waiting on `IsCompleted` blocks the main thread. Proceed only once the type check in [references/package-install.md](references/package-install.md) returns `ready`.

## 2. Read the documentation

Read [documentation-lookup.md](references/documentation-lookup.md) before any workflow or diagnosis, and its [API reference](references/documentation-lookup.md#api-reference) section before guessing a package or Engine API signature.

## 3. Localization Settings & Locales

**Always pass the search folders** to `AssetDatabase.FindAssets`, because an unscoped search covers read-only packages and can return an asset you cannot edit. This applies to every `FindAssets` call here. If `LocalizationEditorSettings.ActiveLocalizationSettings` is null, find or create it, activate it, and ensure the locales exist: [references/project-setup.md](references/project-setup.md#localization-settings--locales).

## 4. Modifying Localization Tables
Always create the required asset tables, unless there is already an existing one in the project. Match by `Locale.Identifier.Code` explicitly when populating from a dataset: the order of `GetLocales()` is not guaranteed to match your input data array. After any modification, dirty the collection and its `SharedData`, call `LocalizationEditorSettings.EditorEvents.RaiseCollectionModified`, then `AssetDatabase.SaveAssets()`. The [safe population pattern](references/project-setup.md#modifying-localization-tables) spells out each call, including the Asset Table GUID pattern.

## 5. UI Localization and Layout

Read [locale-switching.md](references/locale-switching.md) before adding a language menu or any locale-switching code. Wire labels with the public `UnityEngine.Localization.Components.LocalizeStringEvent` component: [references/ui-localization.md](references/ui-localization.md#localized-string-events-robust-binding) has the binding and layout-rebuild steps.

Do **not** reflect into `UnityEditor.Localization.Plugins.TMPro.LocalizeComponent_TMPro` or its UGUI counterpart, because they are `internal` and can change in any package release.

## 6. Asian Language Font Support (CJK)
Read [references/cjk-fonts.md](references/cjk-fonts.md) before setting up Chinese, Japanese or Korean fonts, and follow it in order.

## 7. Automatic Layout (UGUI)

Read the UGUI auto layout pages in [references/docs-map.md](references/docs-map.md) before changing a layout. Change only the containers of labels that overflow in at least one locale, and verify by switching to each locale and checking `TMP_Text.isTextOverflowing`.

Smart strings: [references/ui-localization.md](references/ui-localization.md#automatic-layout-ugui).

### Before declaring the work done

Read [translating-existing-project.md](references/translating-existing-project.md) when localizing UI that already exists: minimal-code-change mapping, listener wiring with read-back checks, and refresh rules. Then run the [table completeness check](references/table-completeness-check.md) and report its output.

## 8. Recommended Translation Strategy
Read [references/translation-strategy.md](references/translation-strategy.md) when translating a project or finding text that still needs localizing.

## 9. Accelerated Localization Workflow
To localize an entire project in one pass, use [scripts/L10nBatchProcessor.cs](scripts/L10nBatchProcessor.cs).

**Ask before acting:** Before running any batch operation, confirm with the user:
> "This will open every scene in the project, attach `LocalizeStringEvent` components, and save all modified scenes. This cannot be undone automatically. Shall I proceed?"

Only proceed once the user has confirmed, and do not remove or bypass the confirmation checks `LocalizeAll` enforces. It walks **both** `Text` and `TMP_Text`, and **returns the labels it could not match**: print that list, because a run that wires 20 labels and silently leaves 9 alone looks identical to a complete one otherwise. Dialog, cancellation and speed tips: [references/batch-localization.md](references/batch-localization.md).

## Troubleshooting errors

Error in the console or the game UI: look it up in [references/troubleshooting.md](references/troubleshooting.md), apply the fix, then reread the [docs pages](#2-read-the-documentation) for that step.

## Final step

Run these checks in order; if one fails, reread the [docs pages](#2-read-the-documentation) to find out what you missed, fix it, and rerun.

1. Run `unity command console status` (the `console_status` check) and confirm `groundTruth.consoleErrors` is 0 and `compilationFailed` is false.
2. Run the [table completeness check](references/table-completeness-check.md) and keep its output for the report.
3. Stop there unless the user asked for proof or a fault is suspected, such as a label that doesn't change when the locale changes. Then enter Play mode once, read the world through `eval` (for example `LocalizationSettings.SelectedLocale` and the label's `text`) rather than adding logging, take no screenshots because they take too much time, and exit Play mode when you're done.

## Final report

Report these in order:

1. **What changed**: locales, tables, keys, components and font assets you added or changed.
2. **Not converted**: every text site you didn't convert, and why, including `LocalizeAll`'s unmatched labels.
3. **Verification results**: the result of each Final step check, including the table completeness check output and any gaps.
4. **Follow-up**: what the user must do, such as confirm which gaps are intentional, review translations, or rebuild Addressables content.
