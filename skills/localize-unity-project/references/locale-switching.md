# **Namespacing & Conflicts**

- **Single Instance:** Always check `GameObject.Find("YourCanvasName")` and destroy the old one before creating a new one.
- **Locale switching: use the package, and keep preview and runtime separate.** These are two
  different mechanisms, and conflating them is why locale switching often ends up hand-rolled.
  - **To preview a locale while authoring**, use the **Localization Scene Controls** window
    (`Window > Asset Management > Localization Scene Controls`). This is Editor-only. It is not a
    runtime feature, so it is not the answer when the game itself needs a language setting.
  - **To switch locale at runtime**, assign `LocalizationSettings.SelectedLocale`. That is the
    supported entry point, and everything bound through `LocalizeStringEvent` updates from it.
  - **To pin which locale the game starts in**, configure a startup locale selector on the
    Localization Settings asset. `SpecificLocaleSelector` is the one that forces a chosen locale;
    the default chain otherwise picks up the system language.
  - **NEVER hand-roll locale state.** A real in-game language menu is fine and expected, as long as
    it sets `SelectedLocale` and lets the package propagate the change. What is forbidden is a debug
    dropdown or menu that tracks its own "current language" variable, swaps strings itself, or
    reaches around the package, because nothing else in the project will follow it.
