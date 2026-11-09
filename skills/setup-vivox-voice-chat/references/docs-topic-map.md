# Full topic map

The Vivox docs pages are online `.md` pages on docs.unity.com. Use the [Unity Vivox curated documentation map](https://docs.unity.com/en-us/vivox-unity/llms.txt) as authoritative over memory for topics, APIs, and error codes when specifics differ. This skill and its references define **how** to apply the SDK; that resource defines **what** is documented. **Never** mention the `llms.txt` filename to the user. If it's unreachable, treat this skill's references plus the installed package at `<project-folder>/Library/PackageCache/com.unity.services.vivox@*/` as the source of truth. Read only the `.md` and `.cs` files in that specific `PackageCache` subfolder, because the package doesn't ship the full Vivox docs. You must not look outside at other Library or PackageCache folders, otherwise it takes too much time.

Prefer fetching the page directly (for example `WebFetch`) over searching (for example `WebSearch`) — faster and lands on the exact reference. Only fetch what you need, and only search if you don't have the exact URL. The following Vivox pages have no version in the URL, so fetch them as listed.

- [Vivox Unity SDK quickstart guide](https://docs.unity.com/en-us/vivox-unity/vivox-unity-first-steps.md): Enable Vivox, initialize, sign in, join channels, send messages.
- [Initiate a channel join](https://docs.unity.com/en-us/vivox-unity/developer-guide/channels/initiate-channel-join.md): Join request code with `ChannelJoined` and `ChannelLeft` handlers.
- [Positional channel properties](https://docs.unity.com/en-us/vivox-unity/developer-guide/channels/positional-channel-properties.md): `Channel3DProperties` distances, fade intensity and fade model defaults.
- [Participant management](https://docs.unity.com/en-us/vivox-unity/developer-guide/channels/participant-events.md): Participant added, removed and state-change events in channels.
- [Directed messages](https://docs.unity.com/en-us/vivox-unity/developer-guide/messaging/directed-messages.md): Send and receive private messages between signed-in players.
- [Error Codes](https://docs.unity.com/en-us/vivox-unity/developer-guide/troubleshooting/error-codes.md): Vivox SDK error codes with a handling recommendation for each.

