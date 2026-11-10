# LevelPlay Integration Overview and Topic Map

LevelPlay is Unity's ad mediation platform: it connects your game to multiple ad networks simultaneously and runs a unified auction across multiple ad networks and bidders to maximize competition for each impression. This guide walks you through the full integration: installing the SDK, configuring dependencies for Android and iOS, initializing LevelPlay in your project, and implementing rewarded, interstitial, and banner ads. If you already have part of this set up, you can skip ahead to the relevant step.

## When to Read Detailed References

Read specific references based on what the user is doing:

- **`references/dependency-resolution.md`**: Resolving native dependencies (Step 4), or gradle/CocoaPods build failures
- **`references/initialization-api.md`**: Step 7 init code-organization options and ILRD init wiring; also user ID, segmentation, consent management, advanced config
- **`references/privacy-settings.md`**: GDPR, CCPA, or COPPA compliance (incl. legacy `SetConsent` and the full network key list)
- **`references/ios-setup.md`**: iOS builds — ATT, SKAdNetwork, the iOS coroutine initializer
- **`references/rewarded-api.md`** / **`references/interstitial-api.md`** / **`references/banner-api.md`**: Implementing each ad format (Step 9)
- **`references/best-practices.md`**: Strategy detail (Step 8), the Step 9 code-generation guidelines, optimization, placement
- **`references/ilrd-api.md`**: Wiring ILRD to an analytics platform
- **`references/testing-and-validation.md`**: Mock ads and the Test Suite (Step 10)
- **`references/troubleshooting.md`**: Compile/build errors, ads not loading, callbacks not firing
- **`references/migration-sdk-9.md`**: Migrating from IronSource or older LevelPlay APIs, upgrading the SDK to 9.x.x, migrating from Unity Ads, or Maven Central dependency build failures (Step 0)

## Adding More Ad Formats Later

When a working integration needs another format, go back to Step 9 and keep the user's existing pattern. Read [adding more ad formats later](references/adding-more-ad-formats.md) for the steps and the worked example.

## Best Practices

Before implementing ad code, read [best practices](references/best-practices.md). It covers loading strategy (per format), placement strategy, error handling and graceful degradation, memory management, frequency management, and common mistakes to avoid — incorporate these patterns into all ad implementations.

## Examples

Read [examples](references/examples.md) when a short trace of the spine helps — it walks the revenue-focused, UX-focused, and existing-project asks.
