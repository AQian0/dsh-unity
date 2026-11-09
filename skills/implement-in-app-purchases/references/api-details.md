# Initialization

Read [Initialize Unity IAP](https://docs.unity.com/en-us/iap/set-up-in-app-purchasing.md) and [Create your catalog programmatically](https://docs.unity.com/en-us/iap/code-catalog.md).

- Subscribe to every event **before** `await store.Connect()`, because pending purchases from a previous session can fire as soon as the store connects. Initialize in `Awake()` so IAP is ready before other `Start()` methods.
- Subscribe to the failure event of every call (`OnStoreDisconnected`, `OnProductsFetchFailed`, `OnPurchasesFetchFailed`, `OnPurchaseFailed`) and to `OnPurchaseDeferred`. Missing failure events cause runtime warnings, and a missing `OnPurchaseDeferred` silently drops Ask-to-Buy and Google deferred purchases.
- `GetProducts()` and `GetPurchases()` return caches. Call `FetchProducts()` / `FetchPurchases()` first; `FetchPurchases()` overwrites the whole cached list.

# Purchases

Read [Purchases](https://docs.unity.com/en-us/iap/purchases.md).

- `store.PurchaseProduct(product)` leads to `OnPurchasePending` with a `PendingOrder`. Grant the content, save it, then call `store.ConfirmPurchase(pendingOrder)`, because unconfirmed purchases are re-delivered on the next launch.
- `OnPurchasePending` can fire more than once for the same purchase (for example, after a restart before confirmation). Check whether the content was already granted before granting it.
- Confirmed consumables are NOT returned by `FetchPurchases()`. Track consumable grants yourself, for example in Cloud Save or Economy.
- On `OnPurchaseDeferred`, show a pending state and don't grant. The purchase arrives later through `OnPurchasePending` if approved.

# Restore

Read [Restore purchases](https://docs.unity.com/en-us/iap/restore-purchases.md).

- `store.RestoreTransactions(callback)` re-delivers non-consumables and renewable subscriptions, each through `OnPurchasePending`. Add a "Restore Purchases" button on iOS, because Apple's review guidelines require one.
- Apple non-renewable subscriptions can't be restored through `RestoreTransactions`, so track them server-side.

# Receipt validation

Read [Receipt validation](https://docs.unity.com/en-us/iap/receipt-validation.md).

- Google Play: validate locally with `CrossPlatformValidator(GooglePlayTangle.Data(), Application.identifier)`. Generate the tangle with **Services > In-App Purchasing > Receipt Validation Obfuscator**.
- Apple StoreKit 2: local validation is a no-op. Send `order.Info.Apple?.jwsRepresentation` to a server for validation.

# Ownership and subscriptions

Read the [EntitlementStatus API](https://docs.unity3d.com/Packages/com.unity.purchasing@<VERSION>/api/UnityEngine.Purchasing.EntitlementStatus.html) and the [SubscriptionInfo class reference](https://docs.unity.com/en-us/iap/subscriptioninfo-class-reference.md).

- To check whether the player owns a product, call `store.CheckEntitlement(product)`, handle `store.OnCheckEntitlement`, and compare with `EntitlementStatus.FullyEntitled`. This replaces v4's `product.hasReceipt`.
- Subscription info is on `order.Info.PurchasedProductInfo`, NOT on `CartItem`. `IsSubscribed()` returns `Result`, not `bool`, so compare with `== Result.True`.

# Compile errors

- `ProductFetchFailed` has `.FailureReason` and `.FailedFetchProducts`, not `.Message`, and `StoreConnectionFailureDescription` has `.Message`, not `.reason`. A wrong name causes CS1061. The full table and the other common v5 mistakes are in [api-notes.md](../references/api-notes.md).
