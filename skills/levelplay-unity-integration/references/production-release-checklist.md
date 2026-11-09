# Production Release Checklist

Before releasing to production:

- [ ] Test Suite validation completed successfully on device
- [ ] All ad formats load correctly (Rewarded, Interstitial, Banner if implemented)
- [ ] All callbacks fire as expected
- [ ] App Key and ad unit IDs verified correct for production
- [ ] Tested on multiple devices (different screen sizes, OS versions)
- [ ] **iOS-specific requirements completed** (if targeting iOS):
  - [ ] SKAdNetwork IDs configured in Info.plist (see `references/ios-setup.md`)
  - [ ] App Tracking Transparency (ATT) framework implemented (see `references/ios-setup.md`)
  - [ ] iOS privacy manifest configured if required
  - [ ] Tested on physical iOS device (not just simulator)
- [ ] **Android-specific requirements completed** (if targeting Android):
  - [ ] Google Play Services dependencies resolved (Step 4 completed)
  - [ ] AD_ID permission added to AndroidManifest.xml if targeting API 33+ (see Step 4)
  - [ ] Tested on physical Android device
- [ ] Tested with real ads in production environment
- [ ] Ad frequency capping implemented (if using interstitials)
- [ ] Error handling works correctly (test with airplane mode - ads should fail gracefully without crashing or blocking gameplay)

