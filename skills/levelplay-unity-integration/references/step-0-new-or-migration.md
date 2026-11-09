# 0. New Integration or Migration?

Ask: "Are you starting a new LevelPlay integration, migrating an existing one (from an older SDK version or from Unity Ads), or troubleshooting an existing setup?"

- **New integration**: proceed to Step 1.
- **Migration** (SDK upgrade, replacing IronSource.Agent APIs, migrating from Unity Ads, or fixing a Maven Central Android build failure): Read `references/migration-sdk-9.md`. Ask which of the five scenarios applies — A = SDK upgrade, B = init API migration, C = ad unit API migration, D = Maven Central build failure, E = Unity Ads migration — then follow the matching scenario. After applying all code changes, work through the Migration Completeness Checklist (section C5 of the reference) — it catches requirements that a line-by-line translation misses because the legacy code had no equivalent line. Then ask the user to check the Unity console for compilation errors, and fix any that appear before presenting results. Do not block or keep retrying if you cannot see the console: list the files you changed, say what to look for, and continue.
- **Troubleshooting or adding to an existing setup** (ATT, GDPR, ILRD, Test Suite, build errors on a fresh integration, or adding a feature to an already-working integration): Identify what the user needs and go directly to the relevant step or reference from "When to Read Detailed References."

