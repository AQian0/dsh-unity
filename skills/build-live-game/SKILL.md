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

## Documentation Map

Read [orientation.md](references/orientation.md#documentation-map) before acting on any service — training knowledge about UGS is often out of date; it lists the pages to read per service and how to version the package URLs. Its [glossary](references/orientation.md#glossary) explains ambiguous terms (Building Block, `.ccmu` versus `.ccmr`, CloudBehaviour, protected versus custom data).

## UGS Packages

Minimum versions and each package's purpose, including the `.ccmu` versus `.ccmr` split: [services-overview.md](references/services-overview.md#package-minimum-versions).

## Initialization Pattern

Every UGS game initializes `com.unity.services.core` first, then signs in — `UnityServices.InitializeAsync()` → `AuthenticationService.Instance.SignInAnonymouslyAsync()` — after which every other service is ready. Snippet: [architecture.md](references/architecture.md#initialization-pattern).

## Architecture — How Packages Combine

The package graph and the three common patterns (config + state + server writes; client-direct data; competitive features) are in [architecture.md](references/architecture.md). **Key principle:** game-integrity data (XP, rewards, currency) is written through Cloud Code modules; direct client writes only suit non-sensitive data (preferences, display settings).

## Validation

After writing live-game code, run these checks in order. If one fails, fix the cause and re-run it; if the fix does not work, reread the matching documentation pages and `references/` file.

1. Check the project compiles: read the Editor console (or the Editor log) and confirm zero compile errors.
2. Check the initialization order in the code: search for `UnityServices.InitializeAsync()` and confirm it runs before the sign-in call, and that sign-in completes before any service call.
3. Check that sensitive writes (XP, rewards, currency) go through Cloud Code: search the client for Cloud Save `SaveAsync` calls on those keys and move any you find into a module; confirm each read uses the written bucket's access class, because a mismatch returns no data.
4. Deploy the cloud resource files the feature uses (`.rc`, `.ac`, `.ccmu`/`.ccmr`, `.lb`) to the active environment with `Deploy.cs` from `references/deployment.md` and read the output: every file must report `Success`; `not a deployable item` or `Error` means it failed. Without `com.unity.pipeline` and `com.unity.services.deployment.api`, ask the user to deploy from the Deployment Window and report each file's status.
5. Check Access Control by its effect: if the feature deploys an `.ac` policy denying direct player writes, enter Play mode, run one direct Cloud Save write to a covered key (a temporary `SaveAsync` call), confirm it fails with `403`, then remove the call. Skip when the feature has no `.ac` file.
6. Enter Play mode, run the feature once, and confirm the `Debug.Log` lines from [Before You Start](#before-you-start) appear in the order you expect and the console has zero errors.

## Detailed References

### Service References
- **Core services** — package and authoring model per feature, versions, full API: [references/services-overview.md](references/services-overview.md)
- **Authentication** — sign-in methods, events, profiles, identity providers: [references/authentication.md](references/authentication.md)
- **Cloud Code** — model choice: [references/cloud-code.md](references/cloud-code.md); modules: [references/cloud-code-modules.md](references/cloud-code-modules.md); CloudBehaviours: [references/cloud-code-cloudbehaviours.md](references/cloud-code-cloudbehaviours.md)
- **Cloud Save** — access classes, data operations, files, queries: [references/cloud-save.md](references/cloud-save.md)
- **Remote Config** — definitions, `.rc` format, Game Overrides: [references/remote-config.md](references/remote-config.md)
- **Tooling** — `.ac` policies, `.ugo` Game Overrides, URN reference: [references/tooling.md](references/tooling.md)
- **Deployment** — file types, workflow, programmatic API: [references/deployment.md](references/deployment.md)
- **UGS CLI** — `unity ugs` install, auth/setup, headless deploy: [references/ugs-cli.md](references/ugs-cli.md)
- **Services APIs** — four client types, service areas: [references/apis.md](references/apis.md)

### Feature Blueprints
- **Starting point** — blueprints, Building Blocks, samples, legacy Cloud Code reuse: [references/blueprints-and-samples.md](references/blueprints-and-samples.md)
- **Achievements** — data models, client code, Cloud Code module, cloud resources: [references/achievements.md](references/achievements.md)
- **Battle Pass** — tiered XP, free/premium tracks, module (premium purchase is an integration stub you must complete): [references/battlepass.md](references/battlepass.md)
- **Player Account** — sign-in flows, identity management, Cloud Save data: [references/player-account.md](references/player-account.md)

## Final Report

When the work is done, end your response with a short report:

1. What you created or changed: files, packages added to `Packages/manifest.json`, and cloud resource files.
2. The checks from [Validation](#validation) that you ran and their results, including any you could not run and why.
3. Follow-ups only the user can do: deploy the cloud resources to the target environment, link the project to a Unity project ID and environment, complete a stubbed integration (such as battle pass `PurchasePremium`), or restore from the restore point if they reject the changes.
4. Which documentation pages you read.
