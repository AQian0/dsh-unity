# 7. Initialize LevelPlay SDK

**Installation checkpoint:**

**First, re-read `Packages/packages-lock.json` and confirm `com.unity.services.levelplay` is there.**
Do this every time you reach this point, even if Step 3 already passed earlier in the conversation.
It costs one file read, and it is the only item here you can settle without the user. An earlier
turn saying the package was installed is not evidence that it is: this check exists because the
install step is the one most often skipped, and the resulting code fails with `CS0246` on every
LevelPlay symbol. If the id is absent, go back to Step 3 and do not write initialization code.

Then confirm the remaining prerequisites with the user, which are the ones no file can answer.
**If the user confirmed they are not using AdMob, omit the Step 6 item.** If Step 4 was already
confirmed in this conversation, skip that item and ask only about Step 5 and Step 6 (if AdMob).

"Please confirm these are working correctly:
- Step 4: Have you run dependency resolution for your target platform(s) without errors?
- Step 5: Do you have your App Key copied from the LevelPlay dashboard?
- Step 6 (only if using AdMob): Have you configured AdMob keys in Unity Editor settings?

Verify these are working before proceeding."

**If the package check failed or they answer NO or are unsure:**
- Package id absent from `packages-lock.json`: code will show `CS0246` namespace errors → Direct to Step 3. This one you established yourself; do not ask the user to overrule it.
- Missing Step 4: Code compiles but Android/iOS builds will fail → Direct to Step 4
- Missing Step 5: They won't have credentials to initialize → Direct to Step 5
- Do not provide C# code until they confirm all steps are complete

**If they answer YES:**
- **Optional — Analytics: ILRD Wiring.** Ask this question verbatim — do not summarize or rephrase it: "Do you use an analytics or attribution platform (Firebase, AppsFlyer, Adjust, Singular, or custom backend) that needs ad revenue data? If yes, the init script will include a logging stub for Impression Level Revenue (ILRD) — 3 lines of code, no analytics platform setup required yet. (Yes / No / Not sure — defaults to yes)" Record the answer.
- Proceed with initialization code.

LevelPlay SDK must be initialized before loading or showing any ads. Initialization should happen early in the application lifecycle.

**Ask how they want to handle initialization. Present all four options exactly as listed — do not condense or omit any:**
1. Create a new dedicated script for LevelPlay initialization
2. Add to an existing initialization/manager script they already have
3. Create a new LevelPlay script that your existing manager references
4. Just show me the initialization code — I'll decide how to integrate it

**Full code for each option is in `references/initialization-api.md` (Code Organization Options).** Behavior that must not change:
- **Option 1 (new script):** If ATT was set up in Step 6.5 (iOS), use the `LevelPlayInitializer.cs` from `references/ios-setup.md` Part 3 (the `IEnumerator Start()` coroutine variant) instead of the plain template.
- **Option 4 (just the code):** provide the complete Option 1 initialization class as a standalone snippet — do NOT create files or add Inspector/GameObject setup steps — with the note: "save it as `LevelPlayInitializer.cs`, attach it to a persistent GameObject in your first scene, and set the App Key field in the Inspector."

**ILRD wiring (if the user answered Yes or Not Sure).** The correct approach depends on the SDK version (check in **Ads Mediation > Network Manager**):
- **SDK 9.5.0+ (current):** add nothing to the initializer — ILRD is delivered per ad instance via `OnAdImpressionDataReady`, wired when each ad is created in Step 9. The global `LevelPlay.OnImpressionDataReady` event is **deprecated on 9.5.0+ and generates a compiler warning** — do not use it.
- **SDK 9.4.x and earlier:** subscribe to the global `LevelPlay.OnImpressionDataReady` event **before** `LevelPlay.Init()`, add a logging stub, and unsubscribe in `OnDestroy()`. On the iOS coroutine initializer, place the subscription inside `InitializeLevelPlay()` immediately before `LevelPlay.Init(appKey)`.

The exact wiring code for each option (including the iOS coroutine placement) is in `references/initialization-api.md` (Version-Aware ILRD Init Wiring). ILRD callbacks do not fire with mock ads — a device build is needed to verify (see Step 10). For advanced options (user ID, segmentation, consent management), see `references/initialization-api.md`.

