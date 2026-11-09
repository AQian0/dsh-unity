# Adding More Ad Formats Later

If you've already integrated some ad formats and want to add more:

1. **Skip to Step 9** - You don't need to repeat the initial setup steps. Before proceeding, verify your existing initialization still works by checking the Unity console for the 'LevelPlay SDK initialized successfully' log.
2. **Choose the additional formats** you want to implement
3. **Follow the same organization pattern** you used before:
   - If you created separate manager scripts, create a new manager script for the new format
   - If you used a unified AdManager, add the new format's code to your existing AdManager class
   - If you used code snippets, integrate new snippets following the same pattern
4. **Follow the same implementation guidelines** from Step 9 for the new ad format
5. **Test the new format** following Step 10 testing guidelines

**Example**: If you initially implemented only Rewarded ads using separate manager scripts, and now want to add Interstitial ads: create `InterstitialAdManager.cs` following the same structure as your `RewardedAdManager.cs`, follow the interstitial guidelines from `references/interstitial-api.md`, and test in Editor and on device. Your existing ad formats keep working while you add new ones.

