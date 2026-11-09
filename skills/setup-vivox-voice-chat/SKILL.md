---
name: setup-vivox-voice-chat
description: Adds and configures in-game voice and text chat with Unity Vivox. Use when asked to add voice or text chat to a multiplayer game, such as team channels, proximity voice, mute controls or private messages.
required_packages:
  com.unity.services.vivox: ">=16.4.0"
---

# Unity Vivox — Voice & Text Chat

Namespace: `Unity.Services.Vivox` | Package: `com.unity.services.vivox`
Companion packages: `Unity.Services.Core`, `Unity.Services.Authentication`

Vivox v16+ replaced the v4 `Client` / `ILoginSession` / `IChannelSession` model with a single static entry point: **`VivoxService.Instance`**. All operations — init, login, channel join, messaging, muting — go through it. Do **not** use v4 patterns (`Client.Instance`, `AccountId`, `ChannelId`, `ILoginSession`, `UnityPurchasing.*`, etc.); those are gone in v16.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Run C# with `unity command script eval --caller plugin --skill setup-vivox-voice-chat --code '<snippet>'`. Don't use `using` directives or unqualified types in the snippet. The compiler reads using `UnityEngine` and a bare AssetDatabase, Volume, or Object causes errors (CS0246 / CS0103 / CS0104). `return` what you want to read; it arrives at `data.result.result`.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for. See [Final step](#final-step).
- Avoid long explanations.

## Step 1

Before you go forward with a workflow or diagnosis:

1. Open and read the [documentation page(s)](#full-topic-map) that cover the specific subject related to what you intend to do or fix and check if you've missed anything.
2. Name the file(s) you read in your response.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong Unity version.

## Full topic map

Read [the docs topic map](references/docs-topic-map.md) before answering any Vivox question — it lists the authoritative page per topic, matched to the installed package version, and what to use when those docs are unreachable.

### API reference

Read [the API reference lookup](references/api-reference-lookup.md) when you need a signature, member, or overload for a specific version: it carries the fetch-and-grep procedure for the Vivox package API and for the engine API, with the URL construction rules.

## Detailed References

Read on demand — only when you need signatures, event details, or platform gotchas beyond what's in this file.

- **Init, sign-in, and access tokens:** [references/init-and-login.md](references/init-and-login.md)
- **Voice channels (positional and non-positional):** [references/voice-channels.md](references/voice-channels.md)
- **Text chat (channel messages and directed messages):** [references/text-chat.md](references/text-chat.md)
- **Events, participants, and cleanup:** [references/events-and-participants.md](references/events-and-participants.md)
- **Troubleshooting and platform notes:** [references/troubleshooting.md](references/troubleshooting.md)

## Step 2. Initialization Order (Do Not Skip Steps)

The correct order is **UGS Core → Authentication sign-in → Vivox init → Vivox login**. Skipping or reordering these fails silently or throws obscure errors.

```csharp
using Unity.Services.Core;
using Unity.Services.Authentication;
using Unity.Services.Vivox;

async void Start()
{
    await UnityServices.InitializeAsync();
    await AuthenticationService.Instance.SignInAnonymouslyAsync();
    await VivoxService.Instance.InitializeAsync();
    // subscribe to events (see table below) BEFORE calling LoginAsync
    await VivoxService.Instance.LoginAsync(new LoginOptions { DisplayName = "Bob" });
}
```

- Calling `VivoxService.Instance.InitializeAsync()` twice throws `5041 VxErrorAlreadyInitialized`. Guard against re-init on scene reload.
- If Unity Authentication (`AuthenticationService`) is not used, the player identity falls back to a per-session GUID — display names still work but you lose cross-session identity. See [references/init-and-login.md](references/init-and-login.md) for the Vivox Access Token (VAT) alternative.

## Step 3. Joining Channels

Vivox has three join methods, one per channel type. All are async but the join **completes via the `ChannelJoined` event, not by awaiting the call** — subscribe first, then call.

| Method | Purpose |
|---|---|
| `VivoxService.Instance.JoinGroupChannelAsync(name, ChatCapability, ChannelOptions?)` | Non-positional (party, team, lobby, guild) |
| `VivoxService.Instance.JoinEchoChannelAsync(name, ChatCapability, ChannelOptions?)` | Test channel that echoes your own audio back |
| `VivoxService.Instance.JoinPositionalChannelAsync(name, ChatCapability, Channel3DProperties, ChannelOptions?)` | 3D spatial audio driven by transform position |

`ChatCapability` values: `TextOnly`, `AudioOnly`, `TextAndAudio`.

**Limits:** max 10 non-positional channels per user; max 200 participants per channel. Exceeding either fails with `20502 VxXmppServerErrorServiceUnavailable`. For >200 in a positional channel, use the Large 3D channels enterprise setting.

Leave with `VivoxService.Instance.LeaveChannelAsync(channelName)` or `LeaveAllChannelsAsync()`. See [references/voice-channels.md](references/voice-channels.md) for `Channel3DProperties` fields and mic-permission handling on Android/iOS.

## Step 4. Text Messaging

**Channel messages** (broadcast to all participants of a channel with `TextOnly` or `TextAndAudio`):

- Send: `VivoxService.Instance.SendChannelTextMessageAsync(string channelName, string message)`
- Receive: subscribe to `VivoxService.Instance.ChannelMessageReceived` (`Action<VivoxMessage>`)

**Directed messages** (peer-to-peer, no channel required):

- Send: `VivoxService.Instance.SendDirectTextMessageAsync(string playerId, string message)`
- Receive: subscribe to `VivoxService.Instance.DirectedMessageReceived` (`Action<VivoxMessage>`)

**Common hallucination:** the send method is `SendDirectTextMessageAsync` — **not** `SendDirectedTextMessageAsync`. The event, however, **is** `DirectedMessageReceived`. Note the asymmetry.

`VivoxMessage` fields: `ChannelName` (null for directed), `SenderDisplayName`, `SenderPlayerId`, `MessageText`, `ReceivedTime`, `Language`, `FromSelf`, `MessageId`.

Edit/delete APIs (`EditChannelTextMessageAsync`, `DeleteChannelTextMessageAsync`, `EditDirectTextMessageAsync`, `DeleteDirectTextMessageAsync`) and history (`GetChannelTextMessageHistoryAsync`, `GetDirectTextMessageHistoryAsync`) are covered in [references/text-chat.md](references/text-chat.md). Chat history retention is 7 days by default.

## Step 5. Required Event Subscriptions

Subscribe to events **before** the corresponding async call. `LoggedIn` may fire immediately for reconnects; `ChannelJoined` fires as the join completes.

| Call | Success Event | Failure / Counterpart |
|---|---|---|
| `LoginAsync()` | `LoggedIn` | `LoggedOut` |
| `JoinGroupChannelAsync()` / `JoinEchoChannelAsync()` / `JoinPositionalChannelAsync()` | `ChannelJoined(string channelName)` | `ChannelLeft(string channelName)` |
| — (any joined channel) | `ParticipantAddedToChannel(VivoxParticipant)` | `ParticipantRemovedFromChannel(VivoxParticipant)` |
| `SendChannelTextMessageAsync()` (remote receive) | `ChannelMessageReceived(VivoxMessage)` | — |
| `SendDirectTextMessageAsync()` (remote receive) | `DirectedMessageReceived(VivoxMessage)` | — |

**Always unsubscribe in `OnDestroy` / `OnDisable`.** `VivoxService.Instance` is a persistent singleton — event handlers on destroyed MonoBehaviours will double-fire and NRE on scene reload.

Per-participant events (`ParticipantMuteStateChanged`, `ParticipantSpeechDetected`, `ParticipantAudioEnergyChanged`) live on the `VivoxParticipant` instance you receive from `ParticipantAddedToChannel` — not on `VivoxService.Instance`. See [references/events-and-participants.md](references/events-and-participants.md).

## Step 6. Access Tokens (Brief)

The default path uses **UGS Authentication** — Vivox mints access tokens automatically from your UGS project once `AuthenticationService.Instance.SignInAnonymouslyAsync()` (or another sign-in method) has completed. **No manual token code is required** for standard flows.

Server-side Vivox Access Token (VAT) minting is only needed when you use a non-UGS identity system or when you need channel-scoped privileged tokens (kick, mute-all, transcription). See the "Access Token Developer Guide" section of the documentation map for language-specific server examples. Do not embed HMAC signing keys in the client.

## Step 7. Validation

After writing code that uses this package:

1. Verify the project compiles without errors and that `using Unity.Services.Vivox;` resolves.
2. Confirm init order: `UnityServices.InitializeAsync` → `AuthenticationService.Instance.SignInAnonymouslyAsync` → `VivoxService.Instance.InitializeAsync` → `VivoxService.Instance.LoginAsync`.
3. No v4 legacy patterns: no `Client.Instance`, no `AccountId`, no `ChannelId`, no `ILoginSession`, no `IChannelSession`. All access goes through `VivoxService.Instance`.
4. The code subscribes to each event it consumes **before** the async call that triggers it, and unsubscribes in `OnDestroy`.
5. Channel join code does not `await` the join call as if it completes join — it subscribes to `ChannelJoined` and reacts there.
6. Directed message send uses `SendDirectTextMessageAsync` (NOT `SendDirectedTextMessageAsync`). Directed message receive uses `DirectedMessageReceived`.
7. Android builds request `RECORD_AUDIO` at runtime before joining an audio channel; iOS builds have `NSMicrophoneUsageDescription` in the plist.
8. Client code embeds no HMAC signing keys or Vivox `SECRET`/`APP_ID` — VAT-based flows are documented but delegated to a server.

## Final step

Do the following checks:

1. Check the project has zero console errors. Use `console_status` for counts.
2. Stop there unless the user asked you to prove it works or you suspect a specific fault.
3. If you do enter Play mode, do it once only to chase a fault you already suspect. Read the world through `script eval` rather than adding logging. Take no screenshots as they take too much time.

If a check fails, go back and reread the [docs pages](#full-topic-map) to find out what you missed.

## Final report

Give the user a concise but not dense checklist of what you did and why, including any incidental side effects (for example, settings you toggled to test something, or temporary files you created). If the user needs to follow up with more steps or decisions, list them. For example:

```
I made the following changes:

[✓] Created a `VivoxBootstrap.cs` script that signs in, logs in to Vivox, and joins a `team-blue` group channel.

Follow these steps to see the effect:

1. Enable Vivox for your project in the Unity Dashboard, and link the Unity project to it.
2. Add the script to a GameObject in the first scene.
3. Enter Play mode and check the Console shows no Vivox errors.
```
