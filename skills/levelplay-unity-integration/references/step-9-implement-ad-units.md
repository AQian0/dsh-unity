# 9. Implement Ad Units

**Read `references/best-practices.md` first** — its "Code Generation Guidelines (Step 9)" section carries the general ad lifecycle, the per-organization-approach code-gen rules, the always-include requirements (MonoBehaviour, `DestroyAd()` in `OnDestroy()`, the placement-capping show-path check (when placements are used), event unsubscription, null checks, error handling), and the bid-floor wiring examples. Incorporate those patterns into all ad implementations.

**Implementation checkpoint:**

"Before providing ad implementation code, please confirm:
- Did you complete SDK initialization in Step 7?
- Did you receive the 'LevelPlay SDK initialized successfully' log message in your Unity console?

Verify initialization is working before proceeding with ad units."

**If they answer NO or are unsure:** direct back to Step 7 and do not provide ad implementation code until initialization is confirmed working.

**Ad format checkpoint — ask before generating any code:** "Which ad formats do you want to implement? Rewarded, Interstitial, Banner, or a combination?" Only implement the formats the user selects. They can add more formats later using the 'Adding More Ad Formats Later' section.

**First, ask the user how they want to organize the ad code. Do not generate any code until they have answered:**

"How would you like to structure your ad implementation?"

1. **Separate manager scripts for each ad format** - Create individual scripts like `RewardedAdManager.cs`, `InterstitialAdManager.cs`, `BannerAdManager.cs` (good for larger projects, clear separation of concerns)

2. **One unified AdManager script** - Create a single `AdManager.cs` that handles all ad formats (simpler, everything in one place)

3. **Just show me the code snippets** - Provide implementation code without wrapping it in specific files, so you can integrate it however you prefer

4. **I already have ad manager code** - Review and help fix/update existing implementation

Based on their answer, adapt your response accordingly (see the code-gen guidelines in `references/best-practices.md`).

**If the user already has ad code (e.g., an existing manager script), ask to see it before generating any** — so you can provide targeted fixes rather than new code from scratch. This applies regardless of which organization option they picked (Option 4 is specifically for reviewing existing code, but the same "show me your code first" applies whenever the user mentions they already have some).

**Then present the optional bid floor feature (skip for Option 4 — review existing code instead):**

Present bid floor ranges only for the formats the user is implementing in this session. Reference starting ranges: Rewarded: $0.50–$2.00 | Interstitial: $0.20–$1.00 | Banner: $0.05–$0.20. Include only the ranges for formats being implemented.

"**Optional — Advanced: Bid Floors**

Most publishers skip this initially and add it once they have real dashboard data. You can safely skip now and return to it later.

If you'd like to set bid floors now: a bid floor sets a minimum bid price (USD) per ad unit — it raises your average eCPM at the cost of lower fill rate. Starting ranges:
[ranges for formats being implemented]

Reply with values per format, or just say 'skip' — you can add them any time."

**Record the answer per format.** Wire `Config.Builder().SetBidFloor(...)` into the ad construction for any format where a value was provided; formats marked 'skip' use the basic constructor (see the bid-floor examples in `references/best-practices.md`).

**If they choose Option 4 (existing code):**
- Ask: "Please share your existing ad manager code for review" and wait for it.
- Analyze the implementation: whether they use the current LevelPlay Ad Unit API (LevelPlayRewardedAd, LevelPlayInterstitialAd, LevelPlayBannerAd), whether they use **deprecated IronSource.Agent APIs**, proper callback registration/unsubscription, and missing error handling or memory leaks.
- Provide specific guidance:
  - If using deprecated APIs: "You're using the old IronSource.Agent API. Here's how to migrate to the new LevelPlay Ad Unit API:" (full migration detail in `references/migration-sdk-9.md` — Scenario B for init, Scenario C per ad format including the C5 completeness checklist)
  - If using current APIs with issues: "Your implementation looks good but I noticed [specific issues]. Here's how to fix them:"
  - If implementation is correct: "Your implementation looks solid. Which additional ad formats would you like to add?"
- Offer fixes as code snippets or suggest refactoring. When adding new formats after review, present the bid floor prompt scoped to those new formats only, confirm whether to match their existing organization pattern or use a new one, then follow the same guidelines as Options 1–3.

For each ad format, follow the implementation guidelines in the detailed references:

- **Rewarded ads**: See `references/rewarded-api.md`
- **Interstitial ads**: See `references/interstitial-api.md`
- **Banner ads**: See `references/banner-api.md`

**Impression Level Revenue Tracking (version-aware):** See `references/ilrd-api.md` to forward impression data to the analytics platform (Firebase, AppsFlyer, Adjust, Singular, or custom backend).
- **SDK 9.5.0+ (current):** subscribe to each ad object's `OnAdImpressionDataReady` event right after you create it (and unsubscribe in `OnDestroy()`). Add this to every ad manager you generate — it is the correct ILRD path in 9.5.0+.
- **SDK 9.4.x and earlier:** ILRD uses the single global `LevelPlay.OnImpressionDataReady` event, wired in the init script (Step 7). If the user answered Yes/Not Sure in Step 7, it is already wired. If they said "No" and want it now, subscribe to `LevelPlay.OnImpressionDataReady` **before** the existing `LevelPlay.Init()` call.

