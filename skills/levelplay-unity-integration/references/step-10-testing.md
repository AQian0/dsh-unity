# 10. Testing and Validation

LevelPlay provides two validation approaches for different stages of development. **Full detail — setup, callback-behavior tables, the Test Suite initializer template, and the iOS coroutine placement — is in `references/testing-and-validation.md`. Read it when the user is testing.**

**Early Development: Mock Ads in Unity Editor.** For rapid iteration and callback testing. Pressing Play in the Editor provides mock ads automatically — but **only if the active build target is Android or iOS** (Standalone/PC/Mac returns no ads; this is the most common "no ads in Editor" cause — see Step 4). Mock ads work with any App Key/Ad Unit ID, but recommend real credentials so they aren't forgotten. Mock ads fire most callbacks (OnAdLoaded/Displayed/Rewarded/Closed) but NOT failure, click, or impression/ILRD callbacks — so test error handling on device. Details and the full callback table: `references/testing-and-validation.md`.

**Integration Validation: LevelPlay Test Suite (Recommended).** The primary method for comprehensive validation against real ad networks on device. Key rules that must not change:
- `LevelPlay.SetMetaData("is_test_suite", "enable");` **before** `LevelPlay.Init()`
- `LevelPlay.LaunchTestSuite();` inside `OnInitSuccess`
- **Requires a device build** (does not work in the Editor); enable **Development Build** so SDK logs are visible; use the production App Key.
- **Remove both lines before production release.**
- iOS coroutine initializer: put `SetMetaData` as the first line inside `InitializeLevelPlay()` before `Init` (not in `Start()`).

Add the two lines to the existing `LevelPlayInitializer.cs` (don't create a new file). The full setup, the standalone template for users without an initializer, and the testing workflow are in `references/testing-and-validation.md`.

