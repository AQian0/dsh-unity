---
name: build-live-game
description: Builds and operates a live game's backend with Unity Gaming Services. Make sure to use this skill when the user wants trusted server-side game logic, player progress, remote configuration, sign-in, achievements, battle passes or leaderboards.
---

# Build a Live Game With Unity Gaming Services

## Before You Start

1. Read the Editor version from `ProjectSettings/ProjectVersion.txt` and the installed UGS package versions from `Packages/packages-lock.json`. Pick the steps below that match (for example `.ccmu` or `.ccmr` modules), because the right workflow depends on the Editor and package versions.
2. Check whether the project is linked to a Unity project ID and environment (**Edit > Project Settings > Services**), and ask the user to link it if it is not.
3. Create a restore point you can roll back to if your changes fail: commit the project in version control. If there is no version control, copy the project folder instead.
4. Before you go forward with a workflow or diagnosis, open and read the documentation pages for the service you will use (see [Documentation Map](#documentation-map)) and the matching file under `references/`, and name the pages you read in your response. This is because your training knowledge about Unity Gaming Services might be out of date, incorrect, or for the wrong package version.
5. Do only what's asked. Don't change unrelated assets or files. Avoid long explanations.
6. When you change runtime behaviour, add `Debug.Log` lines at the points you need to verify (sign-in complete, module call returned, config fetched). You read them in Play mode during [Validation](#validation).

## Glossary

Read [orientation.md](references/orientation.md#glossary) when a UGS term is ambiguous, such as Building Block, `.ccmu` versus `.ccmr`, CloudBehaviour, or protected versus custom data. It maps each term to what the Editor, the package API and the documentation call it.

## Documentation Map

Read [orientation.md](references/orientation.md#documentation-map) before acting on any service, because training knowledge about Unity Gaming Services is often out of date. It lists the pages to read per service and how to version the package URLs.

## UGS Packages

| Package | Min Version | Purpose |
|---|---|---|
| `com.unity.services.core` | 1.16.0 | Initialization, dependency graph |
| `com.unity.services.authentication` | 3.6.1 | Player sign-in and identity |
| `com.unity.services.cloudcode` | 3.0.0 | Server-authoritative C# modules, authored in-project as `.ccmu`. The `2.10.x` line deploys legacy `.ccmr` only — see below |
| `com.unity.services.cloudsave` | 3.4.0 | Per-player and shared key-value storage |
| `com.unity.remote-config` | 4.2.5 | Server-side game configuration |
| `com.unity.services.deployment` | 1.7.2 | Deploy cloud resources from Editor |
| `com.unity.services.tooling` | 1.4.1 | Access Control and Game Overrides |
| `com.unity.services.apis` | 1.1.1 | Generated REST clients for all UGS services |

- [Before You Start](#before-you-start)
- [Glossary](#glossary)
- [Documentation Map](#documentation-map)
- [Initialization Pattern](#initialization-pattern)
- [Architecture — How Packages Combine](#architecture--how-packages-combine)
- [Core Services — Quick Reference](#core-services--quick-reference)
- [Common Architecture Patterns](#common-architecture-patterns)
- [Validation](#validation)
- [Detailed References](#detailed-references)
- [Final Report](#final-report)

## Initialization Pattern

Every UGS game starts the same way. `com.unity.services.core` must initialize first, then the player signs in:

```csharp
using Unity.Services.Core;
using Unity.Services.Authentication;

await UnityServices.InitializeAsync();
await AuthenticationService.Instance.SignInAnonymouslyAsync();
// All other services are now ready
```

## Architecture — How Packages Combine

```
                    UnityServices.InitializeAsync()
                              │
                              ▼
                     AuthenticationService
                    (sign in → PlayerId)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Remote Config     Cloud Save      Multiplayer
      (game config,    (player state,   (sessions,
       definitions,     progress,        matchmaking,
       feature flags)   preferences)     lobbies)
              │               │
              └───────┬───────┘
                      ▼
                 Cloud Code
              (server-authoritative
               writes, validation,
               anti-cheat logic)
                      │
              ┌───────┴───────┐
              ▼               ▼
         Cloud Save       Leaderboards
         (Protected       (score
          writes)          submission)
```

**Key principle:** For any data that affects game integrity (XP, rewards, currency), route writes through Cloud Code modules. Direct client writes are only appropriate for non-sensitive data (preferences, display settings).

## Core Services — Quick Reference

Read [services-overview.md](references/services-overview.md) to choose the right package and authoring model for a feature, including when to write `.ccmu` instead of `.ccmr` and when CloudBehaviours apply. It summarises each service, the version that supports it, and the full reference for its API.

## Common Architecture Patterns

### Pattern 1: Config + State + Server Writes

Used by **Battle Pass** and **Achievements**:

1. **Definitions** in Remote Config (`.rc` file) — what exists in the game
2. **Player state** in Cloud Save — per-player progress
3. **Writes via Cloud Code** — server-authoritative mutations
4. **Access Control** (`.ac` file) — block direct player writes to sensitive keys

### Pattern 2: Client-Direct Data

Used by **Player Account** (preferences, display settings):

1. **Player data** in Cloud Save Default or Public access class
2. **Direct client writes** — no Cloud Code needed for non-sensitive data

### Pattern 3: Competitive Features

Used by **Leaderboards** and ranked systems:

1. **Score submission** via Leaderboards API (or through Cloud Code for validation)
2. **Rankings** retrieved client-side with pagination and player-relative queries

## Validation

After writing code for a live game feature, run these checks in order. If one fails, fix the cause and re-run it before moving on; if the fix does not work, go back and reread the matching documentation pages and `references/` file.

1. Check the project compiles: read the Editor console (or the Editor log) and confirm zero compile errors.
2. Check the initialization order in the code: search for `UnityServices.InitializeAsync()` and confirm it runs before the sign-in call, and that sign-in completes before any service call.
3. Check that sensitive writes (XP, rewards, currency) go through Cloud Code: search the client code for Cloud Save `SaveAsync` calls on those keys and move any you find into a module. Also confirm each Cloud Save read uses the access class of the bucket that was written to, because a mismatched class returns no data.
4. Deploy the cloud resource files the feature uses (`.rc`, `.ac`, `.ccmu` or `.ccmr`, `.lb`; skip the types it does not use) to the active environment with the `Deploy.cs` script in `references/deployment.md`, and read its output: every file must report `Success`. A file reported as `not a deployable item`, or with an `Error` status, has failed. If the project does not have both packages the script needs, `com.unity.pipeline` and `com.unity.services.deployment.api`, ask the user to deploy from the Deployment Window and report each file's status.
5. Check Access Control by its effect: if the feature deploys an `.ac` policy that denies direct player writes, enter Play mode, run one direct client Cloud Save write to a key the policy covers (a temporary `SaveAsync` call), and confirm it fails with a `403`. Remove the temporary call afterwards. Skip this step when the feature has no `.ac` file.
6. Enter Play mode, run the feature once, and confirm the `Debug.Log` lines from [Before You Start](#before-you-start) appear in the order you expect and the console has zero errors.

## Detailed References

### Service References
- **Authentication** — sign-in methods, events, profiles, identity providers, code templates: [references/authentication.md](references/authentication.md)
- **Cloud Code** — choosing a model: [references/cloud-code.md](references/cloud-code.md); scripts and modules: [references/cloud-code-modules.md](references/cloud-code-modules.md); CloudBehaviours: [references/cloud-code-cloudbehaviours.md](references/cloud-code-cloudbehaviours.md)
- **Cloud Save** — access classes, data operations, files, queries, code templates: [references/cloud-save.md](references/cloud-save.md)
- **Remote Config** — definitions, `.rc` format, Game Overrides, code templates: [references/remote-config.md](references/remote-config.md)
- **Tooling** — Access Control (`.ac`) policies, Game Overrides (`.ugo`), URN reference: [references/tooling.md](references/tooling.md)
- **Deployment** — file types, workflow, programmatic API: [references/deployment.md](references/deployment.md)
- **UGS CLI** — `unity ugs` plugin install, auth/setup, headless deploy by file type: [references/ugs-cli.md](references/ugs-cli.md)
- **Services APIs** — four client types, service areas, code templates: [references/apis.md](references/apis.md)

### Feature Blueprints
- **Choosing a starting point** — this skill's blueprints, Asset Store Building Blocks and sample projects, and how to reuse their legacy Cloud Code: [references/blueprints-and-samples.md](references/blueprints-and-samples.md)
- **Achievements** — full implementation with data models, client code, Cloud Code module, cloud resources: [references/achievements.md](references/achievements.md)
- **Battle Pass** — implementation with tiered XP, free/premium tracks, Cloud Code module, cloud resources (premium purchase is an integration stub you must complete): [references/battlepass.md](references/battlepass.md)
- **Player Account** — sign-in flows, identity management, Cloud Save data, code templates: [references/player-account.md](references/player-account.md)

## Final Report

When the work is done, end your response with a short report:

1. What you created or changed: files, packages added to `Packages/manifest.json`, and cloud resource files.
2. The checks from [Validation](#validation) that you ran and their results, including any you could not run and why.
3. Follow-ups only the user can do, for example: deploy the cloud resources to the target environment, link the project to a Unity project ID and environment, complete a stubbed integration (such as battle pass `PurchasePremium`), or restore from the restore point you created if they reject the changes.
4. Which documentation pages you read.
