# Glossary

| Term | Meaning |
|---|---|
| **UGS** | Unity Gaming Services: the backend services (Authentication, Cloud Code, Cloud Save, Remote Config, Leaderboards and others). The Package Manager calls them "Unity Services" |
| **Building Block** | A free Asset Store package with UI, runtime code and cloud resource files for one feature. Its Cloud Code is legacy `.ccmr` |
| **Cloud Code module** | Server-side C# class library. Authored in the Unity project as a `.ccmu` asset on Unity 6000.5+ |
| **`.ccmr`** | Legacy module reference file that points at a C# solution built outside Unity |
| **Script** | Server-side JavaScript endpoint. Legacy: maintain existing ones, don't write new ones |
| **CloudBehaviour** | Experimental Cloud Code class that generates client bindings, synchronized state and push events |
| **Protected data** | Cloud Save player data that the player can read but only server code can write |
| **Custom data** | Cloud Save game-wide data, not tied to one player, written only by server code |
| **Cloud resource file** | A deployable config file (`.rc`, `.ac`, `.ccmu`, `.ccmr`, `.lb`, `.ugo`) that the Deployment Window pushes to a UGS environment |

# Documentation Map

Prefer `WebFetch` over `WebSearch`: it is faster and lands on the exact reference. Only fetch what you need. Pages on docs.unity.com are available as Markdown when the URL ends in `.md`. Replace `<VERSION>` with the following before fetching:

- **Package on docs.unity3d.com**: the installed package version as `major.minor`, for example `3.0`. Read it from `Packages/packages-lock.json` if unsure.
- **docs.unity.com**: the UGS product pages below are unversioned, so there is nothing to replace.

Pages to read before acting:

- Cloud Code C# modules: [Overview](https://docs.unity.com/en-us/cloud-code/modules/overview.md), [Get started](https://docs.unity.com/en-us/cloud-code/modules/getting-started.md), [Module structure](https://docs.unity.com/en-us/cloud-code/modules/how-to-guides/module-structure.md), [Error handling](https://docs.unity.com/en-us/cloud-code/modules/how-to-guides/error-handling.md), [Limits](https://docs.unity.com/en-us/cloud-code/modules/reference/limits.md)
- Cloud Code server authority: [Server authority](https://docs.unity.com/en-us/cloud-code/server-authority.md), [Cheat prevention](https://docs.unity.com/en-us/cloud-code/cheat-prevention.md), [UGS integration and access control](https://docs.unity.com/en-us/cloud-code/server-access-control.md)
- Authentication: [How Authentication works](https://docs.unity.com/en-us/authentication/how-authentication-works.md), [Sessions and cached players](https://docs.unity.com/en-us/authentication/session-management.md), [Common errors](https://docs.unity.com/en-us/authentication/common-errors.md)
- Cloud Save: [Player Data](https://docs.unity.com/en-us/cloud-save/concepts/player-data.md), [Game Data](https://docs.unity.com/en-us/cloud-save/concepts/game-data.md), [Cloud Save for Cloud Code](https://docs.unity.com/en-us/cloud-save/tutorials/cloud-code.md)
- Remote Config: [Remote Config files](https://docs.unity.com/en-us/remote-config/remote-config-files.md), [Code integration](https://docs.unity.com/en-us/remote-config/code-integration.md)
- Leaderboards: [Overview](https://docs.unity.com/en-us/leaderboards.md), [Unity SDK tutorial](https://docs.unity.com/en-us/leaderboards/tutorials/unity-sdk.md)
- Deployment Window: [Deployment package manual](https://docs.unity3d.com/Packages/com.unity.services.deployment@<VERSION>/manual/index.html)
