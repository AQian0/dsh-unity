# Full topic map

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

Prefer `WebFetch` over `WebSearch` — faster and lands on the exact reference. Only fetch what you need.

In docs.unity3d.com URLs, replace `<VERSION>` with the major.minor of `com.unity.purchasing` in `Packages/packages-lock.json` before fetching. The IAP manual pages on docs.unity.com aren't versioned, so use those URLs as written.

- [Unity In-App Purchasing](https://docs.unity.com/en-us/iap.md): overview of the IAP manual and its sections.
- [Initialize Unity IAP](https://docs.unity.com/en-us/iap/set-up-in-app-purchasing.md): install and initialize, with `StoreController` and D2C (`PaymentProvider.Name`, `RemoteCatalogProvider`) samples.
- [Create your catalog programmatically](https://docs.unity.com/en-us/iap/code-catalog.md): define products with `CatalogProvider` and store-specific IDs.
- [Purchases](https://docs.unity.com/en-us/iap/purchases.md): process pending purchases, confirm them, handle failed confirmations, and determine purchase status.
- [Restore purchases](https://docs.unity.com/en-us/iap/restore-purchases.md): restore behavior on Google Play and Apple platforms.
- [Receipt validation](https://docs.unity.com/en-us/iap/receipt-validation.md): local and server-side validation, and the receipt structure.
- [SubscriptionInfo class reference](https://docs.unity.com/en-us/iap/subscriptioninfo-class-reference.md): every `SubscriptionInfo` method and its per-store behavior.
- [Apple App Store](https://docs.unity.com/en-us/iap/apple-store.md): configure IAP for iOS, macOS and tvOS.
- [Use Google Play billing extensions](https://docs.unity.com/en-us/iap/use-google-play-billing-extensions.md): obfuscated IDs and deferred subscription changes.
- [Set up Codeless IAP](https://docs.unity.com/en-us/iap/codeless-iap.md): the IAP Catalog window, IAP buttons and automatic initialization.
- [Upgrade from IAP v4 to v5](https://docs.unity.com/en-us/iap/upgrade-to-iap-v5.md): the official v4 to v5 API mapping.
- [Integrate D2C payment providers workflow](https://docs.unity.com/en-us/iap/payment-providers/workflow.md): the D2C setup workflow for Stripe and Coda.
- [Initiate a purchase](https://docs.unity.com/en-us/iap/payment-providers/initiate-purchase.md): D2C eligibility checks and the Purchase Options UI.
- [Deep link success URL example](https://docs.unity.com/en-us/iap/payment-providers/success-deep-link.md): redirect players back to the app after D2C checkout.
- [Test mode for D2C payments](https://docs.unity.com/en-us/iap/payment-providers/test-mode.md): simulate D2C purchases before a provider account is connected.
- [Comply with Apple and Google external purchase requirements](https://docs.unity.com/en-us/iap/payment-providers/external-purchase-compliance.md): compliance checks, checkout URLs and transaction tokens.
- [Add a routing rule](https://docs.unity.com/en-us/iap/payment-providers/routing.md): choose which payment providers players see.
- [Create your Remote Catalog](https://docs.unity.com/en-us/iap/payment-providers/configure-remote-catalog.md): `.ucat` and `.catalog.csv` catalog items and deployment.

## API reference

The API is `UnityEngine.Purchasing`, part of the `com.unity.purchasing` package. It is versioned by package version, not Unity version, so check the project's installed package version before relying on a specific class or method.

1. Use the `unity-cli` skill to check the installed package version.
2. Fetch and cache `https://docs.unity3d.com/Packages/com.unity.purchasing@<VERSION>/xrefmap.yml`, replacing `<VERSION>` with the installed package's major.minor. This file maps every public API member's fully qualified name to its docs page `href`. Append the `href` to the same base URL, so `href: api/UnityEngine.Purchasing.StoreController.html` becomes `https://docs.unity3d.com/Packages/com.unity.purchasing@<VERSION>/api/UnityEngine.Purchasing.StoreController.html`.
3. Grep the yml file locally for a class or method instead of refetching per lookup. Don't read the whole file.

Always fetch the version matching the installed package rather than relying on training knowledge, since APIs are frequently marked obsolete between major versions (e.g. the v4 `UnityPurchasing` class is obsolete in v5).

Most-used pages:

- [StoreController API](https://docs.unity3d.com/Packages/com.unity.purchasing@<VERSION>/api/UnityEngine.Purchasing.StoreController.html): every `StoreController` method, event and property, with signatures.
- [EntitlementStatus API](https://docs.unity3d.com/Packages/com.unity.purchasing@<VERSION>/api/UnityEngine.Purchasing.EntitlementStatus.html): the entitlement status values.
