---
name: implement-in-app-purchases
description: Implements, configures, and debugs Unity In-App Purchases, including subscriptions, receipt validation, and direct-to-customer payments via Stripe or Coda. Use when asked about real-money purchases or microtransactions, or migrating from native store billing, RevenueCat, Adapty, Essential Kit, or UniPay.
---

# Unity In-App Purchasing

Namespace: `UnityEngine.Purchasing` | Security: `UnityEngine.Purchasing.Security`
Package: `com.unity.purchasing`

**Unity IAP has its own initialization path** via `UnityIAPServices.StoreController()` → `store.Connect()`. It does not require `UnityServices.InitializeAsync()`, but they can coexist if your project uses other UGS services. If Analytics is present and `InitializeAsync()` is called, IAP will automatically send transaction events.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Before making changes, establish a baseline of the current behavior so you can tell whether a later result is actually caused by your change.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for. See [Final step](#final-step).
- Avoid long explanations.

## Before You Start

**Always read [references/pre-check.md](references/pre-check.md) first.** It scans the project for third-party IAP packages, native Google Billing, and existing Unity IAP versions, then routes to the correct path. Do not read any other reference file or make any changes until routing is resolved.

## Full topic map

Documentation pages and API entry points: [references/topic-map.md](references/topic-map.md).
## Detailed References

- **Project scan and path routing (read first):** See [references/pre-check.md](references/pre-check.md)
- **Common v5 API mistakes and where to read each API topic:** See [references/api-notes.md](references/api-notes.md)
- **Platform extension gotchas (Apple, Google):** See [references/platform-notes.md](references/platform-notes.md)
- **Editing `IAPProductCatalog.json` (schema, decimal serialization, refresh):** See [references/codeless-catalog.md](references/codeless-catalog.md)
- **v4 → v5 migration:** See [references/migration-v4-to-v5.md](references/migration-v4-to-v5.md)
- **Convert native Google BillingClient to Unity IAP 5:** See [references/path-convert-native-google-billing.md](references/path-convert-native-google-billing.md)
- **Convert native iOS StoreKit plugin to Unity IAP 5:** See [references/path-convert-native-storekit.md](references/path-convert-native-storekit.md)
- **Convert Essential Kit billing to Unity IAP 5:** See [references/convert-essentialkit.md](references/convert-essentialkit.md)
- **UniPay (FLOBUK) — assessment and guidance:** See [references/convert-unipay.md](references/convert-unipay.md)
- **RevenueCat — conversion assessment and guidance:** See [references/convert-revenuecat.md](references/convert-revenuecat.md)
- **Adapty — conversion assessment and guidance:** See [references/convert-adapty.md](references/convert-adapty.md)
- **Add Unity IAP 5 to a project with no existing IAP:** See [references/path-add-iap-to-new-project.md](references/path-add-iap-to-new-project.md)
- **Implement IAP D2C Capabilities (third-party payment provider — Stripe/Coda, requires v5.4+):** See [references/path-implement-iap-d2c.md](references/path-implement-iap-d2c.md)

Read reference files on demand — only when you need the API gotchas, platform extension details, or migration mappings.

## Core rules

Read the linked page for the flow and sample code before writing each part, and reread it if the code fails. The rules below are the mistakes agents make that the pages don't stop them making.

## API details

Initialization, purchases, restore, receipt validation, ownership/subscriptions, and compile errors: [references/api-details.md](references/api-details.md).
## Final step

Do the following checks:

1. Check the project has zero console errors. Use `console_status` for counts.
2. Stop there unless the user asked you to prove it works or you suspect a specific fault.
3. If you do enter Play mode, do it once only to chase a fault you already suspect. Read the world through `eval` rather than adding logging. Take no screenshots, because they take too much time.

If a check fails, go back and reread the [docs pages](#full-topic-map) to find out what you missed.

After writing code that uses this package, also read the code back and check it, because IAP code can compile cleanly and still lose or double-grant purchases:

1. Confirm all API calls match the v5 signatures on the [API reference](references/topic-map.md#api-reference) pages for the installed version — do NOT use v4 legacy patterns (`IStoreListener`, `UnityPurchasing.Initialize`, `ConfigurationBuilder`).
2. Check the "Anti-Hallucination: Common v5 Mistakes" table in [api-notes.md](references/api-notes.md) — do NOT use `OnStoreConnectionFailed` (use `OnStoreDisconnected`), do NOT pass callbacks to `FetchProducts`/`FetchPurchases` (use events), do NOT use `product.receipt` (use `order.Info.Receipt`).
3. Check that all required events are subscribed **before** calling `Connect()` (see [Initialization](references/api-details.md#initialization)).
4. Verify the two-step purchase flow: `OnPurchasePending` → grant content → `ConfirmPurchase(pendingOrder)`.
5. Confirm both success and failure events are subscribed for every async operation (`OnProductsFetched`/`OnProductsFetchFailed`, `OnStoreConnected`/`OnStoreDisconnected`, etc.).
6. If handling subscriptions, verify `IsSubscribed()` is compared with `== Result.True`, not cast to `bool`.
7. If updated files coexist with legacy versions in the same project, use a unique namespace (e.g., add `.Updated` suffix) to avoid CS0101/CS0111 compilation errors.
8. If the project subscribes to `OnAuthAccountChanged` (v5.4+): verify the handler re-fetches products and purchases from scratch — Unity IAP clears both caches before raising this event. Do not read `GetProducts()` or `GetPurchases()` inside the handler.

## Final report

Report the following to the user, in this order:

1. What changed: each file you changed, with the old and new API calls or values where they apply (for example, `IStoreListener.ProcessPurchase` → `OnPurchasePending`).
2. How you verified it: the outcome of each Final step check, including the console error count and anything you read through `eval` in Play mode.
3. Incidental side effects: anything you touched beyond the requested change, such as packages you installed or upgraded, project or Services settings you changed, generated files (for example tangle classes or `IAPProductCatalog.json`), and temporary files you created or removed.
4. Follow-up the user must do, for example product setup in App Store Connect or the Google Play Console, and sandbox testing on a device. Include the manual steps that the path reference file lists.
