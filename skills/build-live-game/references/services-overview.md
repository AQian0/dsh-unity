# Core Services — Quick Reference

## Authentication

**Package:** `com.unity.services.authentication` (>= 3.6.1)

Handles player identity; [How Authentication works](https://docs.unity.com/en-us/authentication/how-authentication-works.md) covers the sign-in methods. After sign-in `PlayerId` is available and the `SignedIn` event fires. `PlayerAccountService` (Unity browser sign-in) lives in a **separate assembly**: `Unity.Services.Authentication.PlayerAccounts`.

- **Full reference:** [references/authentication.md](authentication.md)

## Cloud Code

**Package:** `com.unity.services.cloudcode` **`3.0.0`** for native `.ccmu` authoring (Unity 6000.5+); `>= 2.10.3` maintains legacy `.ccmr` modules. Before you author a `.ccmu`, bump a manifest that pins `2.10.x` to `3.0.0` or later.

Runs server-side C# modules (.NET 8; .NET 10 on Unity 6.7+) for trusted operations. Check the project's Editor version, then **author new modules as `.ccmu` on Unity 6000.5+**: create the module inside the Unity project with **Create > Services > Cloud Code Module Script**. Unity compiles it with the project and generates its client bindings at compile time. `.ccmr` is legacy: on 6000.5+ maintain existing ones only; on an older Editor, author new modules as `.ccmr`.
Call a `.ccmu` module from the client only through its generated bindings, never with `CallModuleEndpointAsync`. Use `CloudCodeService.Instance.CallModuleEndpointAsync` for legacy `.ccmr` modules only.
Write new JavaScript scripts only when the user asks for them; maintain existing ones.

- **Full reference:** [references/cloud-code-modules.md](cloud-code-modules.md)

**CloudBehaviours** (experimental) generate a module's client bindings — RPCs, synchronized state, push
events — from one C# class. Use them for shared match state, per-player secret state or a server-owned
timer; otherwise use a plain Cloud Code module. Requires `com.unity.services.cloudcode` `3.1.0-exp.1`+
and Unity 6000.5+. Check the installed package first: if CloudBehaviours are unavailable, use a plain
stateful module (`[StateScope]`, see the modules reference) instead of stopping, unless the user asks for
the experimental package.

- **Full reference:** [references/cloud-code-cloudbehaviours.md](cloud-code-cloudbehaviours.md)

## Cloud Save

**Package:** `com.unity.services.cloudsave` (>= 3.4.0)

Per-player key-value storage in three access classes (Default, Public, Protected), plus game-wide Custom data. Protected and Custom data can be written only by server code, so store anti-cheat and server-awarded state there. See [Player Data](https://docs.unity.com/en-us/cloud-save/concepts/player-data.md) and [Game Data](https://docs.unity.com/en-us/cloud-save/concepts/game-data.md) for the read and write rules of each class.

- **Full reference:** [references/cloud-save.md](cloud-save.md)

## Remote Config

**Package:** `com.unity.services.remote-config` (>= 4.2.5)

Server-side game configuration. Store game definitions (achievement lists, battle pass tiers, shop catalogs) as JSON entries updatable without a client build. Deployed via `.rc` files through the Deployment Window.

For A/B testing and audience targeting, use Game Overrides (`.ugo`) via the Tooling package.

- **Full reference:** [references/remote-config.md](remote-config.md)

## Tooling

**Package:** `com.unity.services.tooling` (>= 1.4.1)

Editor-only package. Registers **Access Control** (`.ac`) and **Game Overrides** (`.ugo`) file types with the Deployment Window. Use Access Control to deny direct player writes to protected keys; Deny takes precedence over Allow.

- **Full reference:** [references/tooling.md](tooling.md)

## Deployment

**Package:** `com.unity.services.deployment` (>= 1.7.2)

Editor-only package providing the **Deployment Window** (Services > Deployment). Deploys cloud resources to a target environment:

The Deployment Window deploys the cloud resource files: `.rc` (Remote Config), `.ac` (Access Control), `.ccmu` (in-project Cloud Code module, preferred), `.ccmr` (legacy module reference), `.lb` (Leaderboard) and `.ugo` (Game Overrides).

- **Full reference:** [references/deployment.md](deployment.md)

## UGS CLI

The UGS CLI ships as a Unity CLI plugin, run as `unity ugs <command>`, to deploy and fetch cloud resources outside the Editor. Install, auth/setup and which file types it deploys: [references/ugs-cli.md](ugs-cli.md). Plugin system: the **unity-cli** skill.

## Services APIs

**Package:** `com.unity.services.apis` (>= 1.1.1)

Auto-generated REST clients for all UGS services, in four client types (`IGameClient`, `IAdminClient`, `IServerClient`, `ITrustedClient`). Use the high-level package SDKs by default; use Services APIs only for admin API access or when no package SDK covers the call.

- **Full reference:** [references/apis.md](apis.md)
