---
name: setup-vivox-voice-chat
description: Adds and configures in-game voice and text chat with Unity Vivox. Use when asked to add voice or text chat to a multiplayer game, such as team channels, proximity voice, mute controls or private messages.
required_packages:
  com.unity.services.vivox: ">=16.4.0"
---

# Unity Vivox — Voice & Text Chat

Namespace: `Unity.Services.Vivox` | Package: `com.unity.services.vivox`
Companion packages: `Unity.Services.Core` and `Unity.Services.Authentication`

Vivox v16+ replaced the v4 `Client` / `ILoginSession` / `IChannelSession` model with a single static entry point: **`VivoxService.Instance`**. All operations go through it. Do **not** use v4 patterns (`Client.Instance`, `AccountId`, `ChannelId`, `ILoginSession`, `UnityPurchasing.*`, etc.); those are gone in v16.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Run C# with `unity command script eval --caller plugin --skill setup-vivox-voice-chat --code '<snippet>'`. Don't use `using` directives or unqualified types in the snippet. The compiler reads using `UnityEngine` and a bare AssetDatabase, Volume, or Object causes errors (CS0246 / CS0103 / CS0104). `return` what you want to read; it arrives at `data.result.result`.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for. See [Final step](#final-step).
- Avoid long explanations.

## Step 1

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject you intend to work on and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

## Full topic map

Read [the docs topic map](references/docs-topic-map.md) before answering any Vivox question — authoritative page per topic for the installed package version, and what to use when those docs are unreachable. For signatures or overloads use [the API reference lookup](references/api-reference-lookup.md).

Each step links the reference it needs; read that reference for detail beyond this file.

## Step 2. Initialization Order (Do Not Skip Steps)

The correct order is **UGS Core → Authentication sign-in → Vivox init → Vivox login** — skipping or reordering fails silently or throws obscure errors. Full snippet: [init-and-login.md](references/init-and-login.md).

- Calling `VivoxService.Instance.InitializeAsync()` twice throws `5041 VxErrorAlreadyInitialized`. Guard against re-init on scene reload.
- Without Unity Authentication, player identity falls back to a per-session GUID and cross-session identity is lost. VAT alternative: [init-and-login.md](references/init-and-login.md).

## Step 3. Joining Channels

Three join methods — `JoinGroupChannelAsync`, `JoinEchoChannelAsync` (test echo), `JoinPositionalChannelAsync` (3D) — each taking a `ChatCapability` (`TextOnly`, `AudioOnly`, `TextAndAudio`). The join **completes via the `ChannelJoined` event, not by awaiting the call** — subscribe first.

Limits: max 10 non-positional channels per user and 200 participants per channel; exceeding either fails with `20502 VxXmppServerErrorServiceUnavailable`. Leave with `LeaveChannelAsync(channelName)` / `LeaveAllChannelsAsync()`. Signatures, `Channel3DProperties`, and mic permission: [voice-channels.md](references/voice-channels.md).

## Step 4. Text Messaging

**Channel messages:** send with `SendChannelTextMessageAsync(channelName, message)`; receive via `ChannelMessageReceived`. **Directed messages** (peer-to-peer, no channel needed): send with `SendDirectTextMessageAsync(playerId, message)`; receive via `DirectedMessageReceived`.

**Common hallucination:** the send method is `SendDirectTextMessageAsync` — **not** `SendDirectedTextMessageAsync`; the event, however, **is** `DirectedMessageReceived`.

`VivoxMessage` fields, edit/delete APIs, history (7 days by default), and anti-flooding are in [text-chat.md](references/text-chat.md).

## Step 5. Required Event Subscriptions

Subscribe to events **before** the corresponding async call (`LoggedIn` may fire immediately for reconnects; `ChannelJoined` fires as the join completes). Event table: [events-and-participants.md](references/events-and-participants.md).

**Always unsubscribe in `OnDestroy` / `OnDisable`** — `VivoxService.Instance` is a persistent singleton, so handlers on destroyed MonoBehaviours double-fire and NRE on scene reload. Per-participant events live on the `VivoxParticipant`, not on the service.

## Step 6. Access Tokens (Brief)

The default path uses **UGS Authentication** — Vivox mints access tokens once sign-in completes, so **no manual token code is required**. Server-side Vivox Access Token (VAT) minting is only needed for a non-UGS identity system or channel-scoped privileged tokens (kick, mute-all, transcription); detail in [init-and-login.md](references/init-and-login.md). Do not embed HMAC signing keys in the client.

## Step 7. Validation

After writing code that uses this package:

1. Verify the project compiles without errors and that `using Unity.Services.Vivox;` resolves.
2. Confirm init order: `UnityServices.InitializeAsync` → sign-in → `VivoxService.Instance.InitializeAsync` → `LoginAsync`.
3. No v4 legacy patterns — no `Client.Instance`, `AccountId`, `ChannelId`, `ILoginSession`, `IChannelSession`; all access goes through `VivoxService.Instance`.
4. The code subscribes to each event it consumes **before** the async call that triggers it, and unsubscribes in `OnDestroy`.
5. Channel join code does not `await` the join call as if it completes join — it subscribes to `ChannelJoined` and reacts there.
6. Directed message send uses `SendDirectTextMessageAsync` (NOT `SendDirectedTextMessageAsync`). Directed message receive uses `DirectedMessageReceived`.
7. Android requests `RECORD_AUDIO` before joining an audio channel; iOS has `NSMicrophoneUsageDescription` in the plist.
8. Client code embeds no HMAC signing keys or Vivox `SECRET`/`APP_ID` — VAT flows are documented but delegated to a server.

## Final step

Do the following checks:

1. Check the project has zero console errors. Use `console_status` for counts.
2. Stop there unless the user asked you to prove it works or you suspect a specific fault.
3. If you enter Play mode, do it once only to chase a fault you already suspect. Read the world through `script eval` rather than adding logging. Take no screenshots — they take too much time.

If a check fails, go back and reread the [docs pages](#full-topic-map) and [troubleshooting](references/troubleshooting.md) to find out what you missed.

## Final report

Give the user a concise but not dense checklist of what you did and why, including any incidental side effects (settings you toggled to test something, temporary files you created). If the user needs to follow up with more steps or decisions, list them. See [the final report example](references/final-report-example.md) for the shape.
