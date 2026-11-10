# Accelerated localization workflow

Detail behind step 9 of the parent skill. The template itself is [scripts/L10nBatchProcessor.cs](../scripts/L10nBatchProcessor.cs).

It walks **both** `Text` and `TMP_Text`, and `LocalizeAll` **returns the labels it could not match**
(as `scene :: object :: "text"`). Print that list. It is the whole point of the return value: a run
that wires 20 labels and silently leaves 9 alone looks identical to a complete one otherwise. The
list covers authored text only, so pair it with the code scan in [translation-strategy.md](translation-strategy.md) and the table completeness
check in `table-completeness-check.md`.

`LocalizeAll` also enforces the confirmation itself, so do not remove or bypass these checks when adapting the template: it refuses to run in batch mode, prompts the user to save or discard unsaved scene changes, and shows a blocking Editor dialog that lists the scenes it will rewrite. Tell the user to watch the Editor and click the confirm button; if they cancel, it throws `OperationCanceledException` and writes nothing. Report that as a cancellation, not an error to work around.

## Technical Tips for Speed

- **Table References:** Use `TableReference` names (strings) instead of GUIDs — they are easier to read and maintain.
- **Batch Refresh:** Use `LocalizationSettings.Instance.ForceRefresh()` after modifications to force the UI to update in the editor.
- **Font Swap Automation:** Create the `GameAssets` table once and use a script to attach the `LocalizedFontAsset` component ([template](../scripts/LocalizedFontAsset.cs)) to all labels in one pass.
