---
name: levelplay-unity-integration
description: Integrates the LevelPlay ad mediation SDK via the Ads Mediation package. Use when the user asks about adding rewarded, interstitial, or banner ads, mediation or ad privacy setup, Android or iOS ad dependency build failures, or migrating from Unity Ads or IronSource APIs.
---

# LevelPlay Unity package/SDK Integration

Work from the project's actual files (or ask the user to confirm in the Editor), never from assumptions; generated C# is MonoBehaviour files the user saves to their project, not inline execution. This skill covers the LevelPlay integration path only. Provide only the files and configurations the steps describe — no extra steps, files, or recommendations from general knowledge — and run the steps in order, one at a time, waiting at each checkpoint. [Core Rules](#core-rules) below are binding from Step 0.

**This file is the workflow spine: it keeps the decisions and checkpoints that gate each step. Exact question wording, longer code, full API detail, and edge cases live in `references/`, linked from the relevant step. Read the linked reference when you reach that step — do not answer from general knowledge instead.**

## Integration Workflow

### 0. New Integration or Migration?

Ask the three-way routing question first — new integration, migration, or troubleshooting — because the answer chooses every later step. Read [new integration or migration](references/step-0-new-or-migration.md) before any SDK upgrade, IronSource or Unity Ads migration, or Maven Central build failure: it holds scenarios A–E and the Migration Completeness Checklist.

### 1. Verify Unity Environment

Confirm `Assets/` and `ProjectSettings/` exist before anything else rather than assuming the project root. Read [verify the Unity environment](references/step-1-verify-environment.md) for the exact prompts, including the not-at-project-root question.

### 2. Understand Business Goals

Record the optimization goal now; Step 8 turns it into a strategy. Read [understand business goals](references/step-2-business-goals.md) for the four answers and the "not sure yet" default.

### 3. Install LevelPlay SDK via UPM

Treat `Packages/packages-lock.json` as a hard gate: no LevelPlay code until `com.unity.services.levelplay` is resolved there. Read [install the SDK](references/step-3-install-sdk.md) for the Package Manager steps, the two look-alike packages to reject, and the lock-file rules that must not be shortcut.

### 4. Resolve Native Dependencies (Critical)

Ask which platforms are targeted and set the active build target before any testing. Read [resolve native dependencies](references/step-4-native-dependencies.md) for the MDR/UEDM/EDM4U procedure and the AD_ID permission.

### 5. Get App Key and Ad Unit IDs

Collect the App Key now and the ad unit IDs before Step 9. Read [get the app key and ad unit IDs](references/step-5-app-key-and-ad-units.md) for the dashboard paths and the new-to-LevelPlay setup links.

### 6. Configure AdMob Keys (If Using AdMob Network)

Only when AdMob is a mediation network in use. Read [configure AdMob keys](references/step-6-admob-keys.md) for the settings path and the missing-menu fix.

### 6.5. Privacy & Regulation Settings (If Required)

Privacy calls must land before `LevelPlay.Init()`, and iOS always needs ATT. Read [privacy and regulation settings](references/step-6-5-privacy-and-regulation.md) for the version-dependent GDPR/CCPA/COPPA APIs, the pre-init ordering, and the legal-advice disclaimer.

### 7. Initialize LevelPlay SDK

Re-read `packages-lock.json`, confirm the prerequisites, present all four init options as written, and ask the ILRD question verbatim. Read [initialize the SDK](references/step-7-initialize.md) before generating any initialization code.

### 8. Recommend Ad Unit Strategy

Map the Step 2 goal to one strategy and state it briefly. Read [recommend an ad unit strategy](references/step-8-ad-unit-strategy.md) for the three strategies, their implementation orders, and the "not sure" wording.

### 9. Implement Ad Units

Ask for the code organization and the formats before writing code, and read `references/best-practices.md` first. Read [implement ad units](references/step-9-implement-ad-units.md) for the four options, the bid-floor prompt, and the version-aware ILRD split.

### 10. Testing and Validation

Mock ads work only on an Android/iOS build target, and the Test Suite needs a device build. Read [testing and validation](references/step-10-testing.md) for the callback tables, the two Test Suite lines, and the iOS placement rule.

#### Production Release Checklist

Walk this before calling the integration done — it is the final gate. Read [production release checklist](references/production-release-checklist.md).

## Common Issues and Solutions

If the user reports a problem, read the matching entry in [troubleshooting](references/troubleshooting.md) and follow it, including where it says to stop generating code. Do not wait for the user to open the reference — surface the fix directly. If they haven't started integration yet, begin with Step 1.

## When to Read Detailed References

Each step links the reference it needs; follow those links. When the request does not map to a single step, start from [the topic map](references/overview.md) — it lists every reference with when to read it, and carries the LevelPlay context and the worked examples. For a reported problem use [troubleshooting](references/troubleshooting.md); for any migration or Maven Central dependency failure use [migration-sdk-9](references/migration-sdk-9.md).

## Core Rules

These guardrails are binding for every step:

- Base editor-side checks on the actual project rather than assumptions — read the project files, or ask the user to confirm in the Editor. The C# scripts generated in this skill are MonoBehaviour files for the user to save to their project, not for inline execution.
- This skill covers the LevelPlay integration path only; it does not cover other mediation SDKs. If the user explicitly asks about alternatives, acknowledge that alternatives exist and point them to those vendors' own documentation — do not describe, characterize, or make claims about competitor products.
- Follow the steps and provide only the files and configurations described in this skill. Do not proactively add steps, create files, or make recommendations based on general knowledge. If the user asks a question outside the scope of this skill, check the skill and reference files first to confirm it is not covered. If it is not, use general knowledge to respond, but do not incorporate additional steps or files into the integration workflow as a result.
- Follow the integration workflow sequentially, one step at a time. Ask only the questions for the current step — do not gather information for future steps in advance. Wait for the user's response at each checkpoint before proceeding.
- When a step points to a reference file, read that reference and use its content — do not substitute general knowledge. Present the four init options (Step 7) and four organization options (Step 9) exactly as written, and ask the ILRD question (Step 7) verbatim.
