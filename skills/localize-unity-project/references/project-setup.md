# Project setup: terms, settings, locales and tables

Detail behind steps 3 and 4 of the parent skill.

## Terms

These names differ between the Editor UI, the package API and this skill:

- **Table collection**: the asset (`StringTableCollection` or `AssetTableCollection`) holding one **table** per locale plus the shared key list, `SharedData`.
- **`LocalizedTmpFont`**: the package type that references a `TMP_FontAsset` entry in an Asset Table.
- **`LocalizedFontAsset`**: this skill's component template ([scripts/LocalizedFontAsset.cs](../scripts/LocalizedFontAsset.cs)), not a package type. It applies a `LocalizedTmpFont` to the `TMP_Text` on its GameObject.

## Localization Settings & Locales

If `LocalizationEditorSettings.ActiveLocalizationSettings` is null, you must find or create it:
1. **Find:** Use `AssetDatabase.FindAssets("t:LocalizationSettings", new[] { "Assets" })`. If found, load the first one and assign it to `LocalizationEditorSettings.ActiveLocalizationSettings`.
   - **Always pass the search folders.** An unscoped `FindAssets` searches the whole project including
     read-only packages, so it can return an asset from a package and you end up pointing the project
     at something you cannot edit. This applies to every `FindAssets` call in this skill.
2. **Create:** If not found, create a new instance and save it to `Assets/Localization/LocalizationSettings.asset`. Use `ScriptableObject.CreateInstance<LocalizationSettings>()` followed by `AssetDatabase.CreateAsset()`.
3. **Activate:** Set `LocalizationEditorSettings.ActiveLocalizationSettings = settings`.
4. **Locales:** Ensure locales (en, fr, de, etc.) exist. Create them if missing and add them to settings using `LocalizationEditorSettings.AddLocale(locale)`.

## Modifying Localization Tables
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
