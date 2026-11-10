# Architecture — How Packages Combine

## Initialization Pattern

Every UGS game starts the same way. `com.unity.services.core` must initialize first, then the player signs in:

```csharp
using Unity.Services.Core;
using Unity.Services.Authentication;

await UnityServices.InitializeAsync();
await AuthenticationService.Instance.SignInAnonymouslyAsync();
// All other services are now ready
```

## Package Graph

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
