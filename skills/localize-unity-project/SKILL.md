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

These names differ between the Editor UI, the package API and this skill:

- **Table collection**: the asset (`StringTableCollection` or `AssetTableCollection`) holding one **table** per locale plus the shared key list, `SharedData`.
- **`LocalizedTmpFont`**: the package type that references a `TMP_FontAsset` entry in an Asset Table.
- **`LocalizedFontAsset`**: this skill's component template ([scripts/LocalizedFontAsset.cs](scripts/LocalizedFontAsset.cs)), not a package type. It applies a `LocalizedTmpFont` to the `TMP_Text` on its GameObject.

## 1. Check the Localization package is installed
Before doing anything else, verify that the Localization package is installed. Many APIs in this skill
will fail silently or throw confusing errors if the package isn't present.

1. **Check by reading the project, not by asking the Package Manager.** Look for
   `com.unity.localization` in **`Packages/packages-lock.json`**, because it records what Unity
   actually resolved and reading it needs no Editor or async call. `Packages/manifest.json` only
   records what was *requested*.
2. **Install if missing:** `UnityEditor.PackageManager.Client.Add("com.unity.localization")`.
3. **Wait properly.** `Client.Add` is **asynchronous**, and busy-waiting on `IsCompleted` blocks the
   main thread you are running on. Return after firing the install, then **poll `packages-lock.json`
   in a later call** until the id appears. The install triggers a domain reload, so expect the first
   poll or two to fail.
4. **Confirm the types are actually loaded** before using them, since the lock file can be written
   before the assemblies are ready:
   ```csharp
   var t = System.Type.GetType(
       "UnityEngine.Localization.Settings.LocalizationSettings, Unity.Localization");
   return t != null ? "ready" : "not loaded yet";
   ```
   Only proceed once that returns `ready`.

## 2. Read the documentation

### Full topic map

Read [documentation-lookup.md](references/documentation-lookup.md) before any workflow or diagnosis. It covers where the package's local docs live, how to version the doc URLs, and which manual page to open first.

### API reference

Read [documentation-lookup.md](references/documentation-lookup.md#api-reference) before guessing a package or Engine API signature. It covers the installed package version, `xrefmap.yml` caching, and grepping it for a class or method.

## 3. Localization Settings & Locales
If `LocalizationEditorSettings.ActiveLocalizationSettings` is null, you must find or create it:
1. **Find:** Use `AssetDatabase.FindAssets("t:LocalizationSettings", new[] { "Assets" })`. If found, load the first one and assign it to `LocalizationEditorSettings.ActiveLocalizationSettings`.
   - **Always pass the search folders.** An unscoped `FindAssets` searches the whole project including
     read-only packages, so it can return an asset from a package and you end up pointing the project
     at something you cannot edit. This applies to every `FindAssets` call in this skill.
2. **Create:** If not found, create a new instance and save it to `Assets/Localization/LocalizationSettings.asset`. Use `ScriptableObject.CreateInstance<LocalizationSettings>()` followed by `AssetDatabase.CreateAsset()`.
3. **Activate:** Set `LocalizationEditorSettings.ActiveLocalizationSettings = settings`.
4. **Locales:** Ensure locales (en, fr, de, etc.) exist. Create them if missing and add them to settings using `LocalizationEditorSettings.AddLocale(locale)`.

## 4. Modifying Localization Tables
Programmatic changes to String or Asset tables require notification to the Editor.
Always create the required asset tables, unless there is already an existing one in the project.

### **Safe Population Pattern**
When populating tables from a dataset, match by `Locale.Identifier.Code` explicitly. The order of `GetLocales()` is not guaranteed to match your input data array — assuming it does will cause silent data mismatches that are very hard to debug.
For **Asset Tables**, use the GUID of the asset: `table.GetEntry(sharedId) ?? table.AddEntry(sharedId, guid);`.

### **Refresh & Notification**
After any modification (adding keys, updating values), notify the Editor so it can refresh its internal state. Skipping this will leave the Editor showing stale data until the next reimport.
1. Call `EditorUtility.SetDirty(collection)`, `EditorUtility.SetDirty(collection.SharedData)`, on each modified `Table`.
2. **Notify:** `LocalizationEditorSettings.EditorEvents.RaiseCollectionModified(sender, collection);`
3. Always call `AssetDatabase.SaveAssets()` at the end.

## 5. UI Localization and Layout
### **Namespacing & Conflicts**

Read [locale-switching.md](references/locale-switching.md) before adding a language menu or any locale-switching code, so the change goes through the package rather than a hand-rolled current-language variable.

### **Localized String Events (Robust Binding)**
1. **Check Component Type:** Identify if the target is `TextMeshPro` or legacy `UnityEngine.UI.Text`.
2. **Bind Correctly:** add the public `UnityEngine.Localization.Components.LocalizeStringEvent`
  component and wire it yourself — set `StringReference` to the table entry, then add an
  `OnUpdateString` listener that assigns the value to the text component (`TMP_Text.text` for
  TextMeshPro, `UnityEngine.UI.Text.text` for legacy Text).

  Do **not** reflect into `UnityEditor.Localization.Plugins.TMPro.LocalizeComponent_TMPro` or its
  UGUI counterpart, because they are `internal` and can change in any package release.
3. **Layout Rebuild:** After setting localized text or populating a list, call `UnityEngine.UI.LayoutRebuilder.ForceRebuildLayoutImmediate(parentTransform)` to ensure dimensions update.

## 6. Asian Language Font Support (CJK)
Read [references/cjk-fonts.md](references/cjk-fonts.md) before setting up fonts for Chinese, Japanese or Korean locales, and follow it in order.

## 7. Automatic Layout (UGUI)
Translated strings are often much longer than the source text, so a label sized for one language clips or overflows in another.

1. Read the UGUI auto layout pages listed in [references/docs-map.md](references/docs-map.md) before changing a layout, because the right layout group and fitter settings depend on the existing hierarchy.
2. Change only the containers of labels that overflow in at least one locale, because a fixed layout that already fits every locale is the user's design.
3. Verify by switching to each locale and checking `TMP_Text.isTextOverflowing` on the affected labels.

### Notes when translating an existing project

Read [translating-existing-project.md](references/translating-existing-project.md) when localizing UI that already exists. It covers minimal-code-change mapping, listener wiring with its read-back checks, and the refresh rules.

### Table completeness check (run this before declaring the work done)

Read [references/table-completeness-check.md](references/table-completeness-check.md), run the check it contains, and report the output.

- **Smart Strings**: Set up smart strings where needed. Inspect the context of each string by taking the entire UI it is on, and any scripts that affect it, into account. Set the context on the string table to ensure translations make sense.

## 8. Recommended Translation Strategy
Read [references/translation-strategy.md](references/translation-strategy.md) when translating an existing project or finding text that still needs localizing.


## 9. Accelerated Localization Workflow
To localize an entire project efficiently, use a batch processing script that handles all scenes in one pass.

**Ask before acting:** Before running any batch operation, confirm with the user:
> "This will open every scene in the project, attach `LocalizeStringEvent` components, and save all modified scenes. This cannot be undone automatically. Shall I proceed?"

Only proceed once the user has confirmed. The batch processor template is in [scripts/L10nBatchProcessor.cs](scripts/L10nBatchProcessor.cs).

`LocalizeAll` also enforces this itself, so do not remove or bypass these checks when adapting the template: it refuses to run in batch mode, prompts the user to save or discard unsaved scene changes, and shows a blocking Editor dialog that lists the scenes it will rewrite. Tell the user to watch the Editor and click the confirm button; if they cancel, it throws `OperationCanceledException` and writes nothing. Report that as a cancellation, not an error to work around.

It walks **both** `Text` and `TMP_Text`, and `LocalizeAll` **returns the labels it could not match**
(as `scene :: object :: "text"`). Print that list. It is the whole point of the return value: a run
that wires 20 labels and silently leaves 9 alone looks identical to a complete one otherwise. The
list covers authored text only, so pair it with the code scan in [references/translation-strategy.md](references/translation-strategy.md) and the table completeness
check in Step 7.

### **Technical Tips for Speed**
- **Table References:** Use `TableReference` names (strings) instead of GUIDs — they are easier to read and maintain.
- **Batch Refresh:** Use `LocalizationSettings.Instance.ForceRefresh()` after modifications to force the UI to update in the editor.
- **Font Swap Automation:** Create the `GameAssets` table once and use a script to attach the `LocalizedFontAsset` component ([template](scripts/LocalizedFontAsset.cs)) to all labels in one pass.

## Troubleshooting errors

If an error appears in the console or the game UI, look it up in [references/troubleshooting.md](references/troubleshooting.md), apply the resolution, then reread the [docs pages](#full-topic-map) for the step that produced it.

## Final step

Run these checks in order. If any check fails, reread the [docs pages](#full-topic-map) to find out what you missed, fix it, and run the checks again.

1. Run `unity command console status` (the `console_status` check) and confirm `groundTruth.consoleErrors` is 0 and `compilationFailed` is false.
2. Run the [table completeness check](references/table-completeness-check.md) and keep its output for the report.
3. Stop there unless the user asked for proof or a specific fault is suspected, such as a label that doesn't change when the locale changes.
4. If a fault is suspected and the change affects runtime behaviour, enter Play mode once to chase it. Read the world through `eval`, for example `LocalizationSettings.SelectedLocale` and the `text` of the label in question, rather than adding logging. Take no screenshots, because they take too much time. Exit Play mode when you're done.

## Final report

Report these in order:

1. **What changed**: locales, tables, keys, components and font assets you added or changed.
2. **Not converted**: every text site you didn't convert, and why, including `LocalizeAll`'s unmatched labels.
3. **Verification results**: the result of each Final step check, including the table completeness check output and any gaps.
4. **Follow-up**: what the user must do, such as confirm which gaps are intentional, review translations, or rebuild Addressables content.
