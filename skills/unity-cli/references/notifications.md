# Notifications

A `--format json` or `--format ndjson` envelope may carry a `notifications`
array: advisories about the user's environment rather than about the command
you ran. **When one is present, tell the user** — they have no other way to see
it, because the human-facing equivalent is a terminal banner that never reaches
you.

The key is absent when there is nothing to report, so read it as
`envelope.notifications ?? []`.

```jsonc
{
  "code": "CLI_UPDATE_AVAILABLE",
  "message": "A new version of the Unity CLI is available: 1.0.0-beta.8 → 1.0.0-beta.9",
  "data": { "current": "1.0.0-beta.8", "latest": "1.0.0-beta.9" },
  "remediation": { "command": "unity self-update", "requiresUserApproval": true }
}
```

Branch on `code`; `message` is localized and meant for display. `data` is
shaped per `code`.

`PLUGIN_UPDATE_AVAILABLE` means an installed plugin has a newer version.
`data` is `{ "plugin": "<id>", "current": "…", "latest": "…" }`, and the
remediation is `unity plugin upgrade <id>`. There is one entry per outdated
plugin.

`remediation` says how the notification gets resolved. It may be absent, which
means the notification is informational and there is nothing to run.

`FEX_EMU_EXPERIMENTAL` means the command ran, or will run, the x86_64 Editor
through FEX-Emu on Linux arm64. Tell the user it is experimental and
unsupported and that C# script compilation is known to crash there.

**`requiresUserApproval: true` means do not run `remediation.command`
yourself.** Surface the notification and the command, and let the user decide.

---
