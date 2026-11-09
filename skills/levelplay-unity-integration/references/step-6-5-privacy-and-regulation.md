# 6.5. Privacy & Regulation Settings (If Required)

> **Note:** This skill provides technical integration guidance, including for LevelPlay's privacy APIs. It is not legal advice, and it does not determine which laws apply to your app — that depends on your users, your data practices, and your distribution. Consult your own legal counsel, and refer to [Regulation Advanced Settings for Unity](https://docs.unity.com/en-us/grow/levelplay/sdk/unity/regulation-advanced-settings) for the authoritative LevelPlay documentation.

Ask the user: "Do you need to configure privacy settings for GDPR, CCPA/CPRA (or certain state privacy consumer acts), or for child-directed apps?"

**If YES to any:**

Privacy settings must be configured **BEFORE** SDK initialization. See `references/privacy-settings.md` for the complete implementation guide (UI, consent management, combined regulations, and the full network key list).

**GDPR — the correct API depends on the user's SDK version** (check in **Ads Mediation > Network Manager**):

**SDK 9.5.0+** — global consent boolean:
```csharp
using Unity.Services.LevelPlay;

// true = user has granted consent, false = user has not consented
LevelPlayPrivacySettings.SetGDPRConsent(true);
```

**SDK 9.4.x** — per-network consent dictionary (this is the CURRENT API on 9.4.x, not legacy — it only becomes `[Obsolete]` on 9.5.0+; do not mislabel it as deprecated):
```csharp
using Unity.Services.LevelPlay;
using System.Collections.Generic;

// Add an entry for each ad network you have installed
LevelPlayPrivacySettings.SetGDPRConsents(new Dictionary<string, bool> {
    { "UnityAds", true },
    { "IronSource", true }
    // See references/privacy-settings.md for the full network key list
});
```

If neither API compiles, your Unity package/SDK may be below 9.4.0 (legacy) — recommend upgrading via **Ads Mediation > Network Manager**. If the user cannot upgrade, the legacy `LevelPlay.SetConsent(bool)` API is documented in `references/privacy-settings.md`.

**CCPA (SDK 9.4.0+):**
```csharp
LevelPlayPrivacySettings.SetCCPA(true); // User opted out of data sale
```

**COPPA (SDK 9.4.0+):**
```csharp
LevelPlayPrivacySettings.SetCOPPA(true); // Child-directed app
```

If CCPA or COPPA fails to compile, upgrade your Unity package/SDK via **Ads Mediation > Network Manager**. Call all of these BEFORE `LevelPlay.Init()` in Step 7.

**For iOS builds — required regardless of privacy regulations above:** Also implement App Tracking Transparency (ATT) before proceeding to Step 7. Apple requires ATT authorization before your app tracks users or accesses the device's advertising identifier on iOS 14.5+. Request ATT authorization before calling `LevelPlay.Init()` — this is both an Apple platform requirement and necessary for personalized ads (which also affects fill rate). See `references/ios-setup.md` for the ATT implementation code.

**If NO privacy regulations and not targeting iOS:** Skip this step and proceed to Step 7.

