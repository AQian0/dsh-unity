# UI localization and layout

Detail behind steps 5 and 7 of the parent skill.

## Localized String Events (Robust Binding)

1. **Check Component Type:** Identify if the target is `TextMeshPro` or legacy `UnityEngine.UI.Text`.
2. **Bind Correctly:** add the public `UnityEngine.Localization.Components.LocalizeStringEvent`
  component and wire it yourself — set `StringReference` to the table entry, then add an
  `OnUpdateString` listener that assigns the value to the text component (`TMP_Text.text` for
  TextMeshPro, `UnityEngine.UI.Text.text` for legacy Text).

  Do **not** reflect into `UnityEditor.Localization.Plugins.TMPro.LocalizeComponent_TMPro` or its
  UGUI counterpart, because they are `internal` and can change in any package release.
3. **Layout Rebuild:** After setting localized text or populating a list, call `UnityEngine.UI.LayoutRebuilder.ForceRebuildLayoutImmediate(parentTransform)` to ensure dimensions update.

## Automatic Layout (UGUI)

Translated strings are often much longer than the source text, so a label sized for one language clips or overflows in another.

1. Read the UGUI auto layout pages listed in [docs-map.md](docs-map.md) before changing a layout, because the right layout group and fitter settings depend on the existing hierarchy.
2. Change only the containers of labels that overflow in at least one locale, because a fixed layout that already fits every locale is the user's design.
3. Verify by switching to each locale and checking `TMP_Text.isTextOverflowing` on the affected labels.

## Smart Strings

- **Smart Strings**: Set up smart strings where needed. Inspect the context of each string by taking the entire UI it is on, and any scripts that affect it, into account. Set the context on the string table to ensure translations make sense.
