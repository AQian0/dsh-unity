# 4. Resolve Native Dependencies (Critical)

**Critical for Android/iOS builds**: LevelPlay requires native dependency resolution. Without this, code compiles in Unity Editor but fails during platform builds with gradle (Android) or CocoaPods (iOS) errors.

**Platform checkpoint — ask before proceeding:** "Which platform(s) are you targeting — iOS, Android, or both?" Record this. It determines which dependency resolution steps apply here, whether ATT is required (Step 6.5), and which testing steps are relevant (Step 10).

**Set the active build target now.** Switch the project's active build target to Android or iOS via **File ▸ Build Profiles** (called **Build Settings** before Unity 6) → **Switch Platform**. This is required before any testing: LevelPlay only runs on Android/iOS targets, so even mock ads in the Editor (Step 10) do nothing while the target is Standalone/PC/Mac.

**Resolve dependencies for the target platform(s).** LevelPlay requires native Android/iOS libraries that Unity's package manager alone doesn't handle; a dependency manager (MDR, UEDM, or EDM4U) bridges this gap. The full procedure — checking for an existing dependency manager, resolving on Android vs iOS, installing one if the user has none, verification, and the older-version Custom Main Gradle Template — is in **`references/dependency-resolution.md`**. Walk the user through it now, and **if targeting both Android and iOS, complete resolution for both before proceeding.**

Ask: "Have you run dependency resolution for your target platform(s) without errors?"

**Android API 33+ (Android 13+):** declare the AD_ID permission in AndroidManifest.xml:

```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
```

Without it, advertising ID access fails on Android 13+ devices. Details in `references/dependency-resolution.md`.

**If dependency resolution fails**, see `references/troubleshooting.md` for gradle and CocoaPods error guidance.

