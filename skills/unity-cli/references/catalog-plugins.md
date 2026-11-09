# Use a catalog plugin for a task the built-in commands don't cover

The CLI ships a catalog of Unity plugins, installed on demand. **Before approximating a request
some other way, or saying the CLI can't do it, check whether a catalog plugin covers it.** A plugin
is Unity's own tool for its class of request, and using it is almost always the better answer.
`unity plugins` always lists the full catalog, installed or not, and the command search
([Find a command](../SKILL.md#find-a-command-search-dont-grep-help)) matches each plugin's name and description.
The steps below use the Unity AI Generators plugin (`ai`), which covers "generate a
texture/sprite/image/3D model for my project", as the example. Every catalog plugin works the same
way.

1. **Find the plugin and check whether it's installed.**
   ```bash
   unity commands --grep "<the request's own words>" --format json
   unity plugins --format json
   ```
   Find the entry whose `id` is the plugin's (`"ai"` here) and read its `installed` field
   (`true` / `false`).

2. **Not installed? Tell the user, then ask, never install silently.** Say plainly that Unity
   ships an AI Generators plugin that covers this, and wait for a yes before running:
   ```bash
   unity plugin install ai
   ```
   A refusal is a normal answer: fall back to whatever you would otherwise have done, and don't
   ask again in the same conversation.

   `unity plugin install <id> --local` writes the plugin's agent skill into the current project
   (`<project>/.claude/skills/...` and the other project-local client folders) instead of each AI
   client's user-wide folder. It applies only to clients that already have Unity's skill in that
   project, and Claude Desktop is skipped because its skills are user-wide only. `unity plugin
   upgrade` never adds a copy: it updates the plugin's skill only where it is already installed,
   user-wide or in the current project. Run it from that project to refresh its copy.

   `ai` is alpha, and during alpha it's gated to Unity staff on Unity's internal network. An
   ordinary user's `unity plugin install ai` can fail with a **sign-in** message (Unity AI
   Generators is limited to Unity staff, so sign in with a Unity staff account) or, once
   past that, a plain **download failure** if the network it needs isn't reachable from where
   you're running. Neither is a bug in the request: report the message and fall back, the same as
   any other refusal.

   `unity plugin install` and `unity plugin upgrade` install the newest build the catalog offers
   you, whatever its channel. When that build is a prerelease (`beta`, or `alpha`/`nightly` for
   Unity staff), a warning says so before the download, in the envelope's `warnings` under
   `--format json`. Pass it on to the user: a prerelease may change or break between versions.

   A plugin whose registry entry carries license terms shows them and waits for an answer
   before anything downloads. `unity plugin install <id>` and `unity plugin upgrade <id>` ask on
   a terminal. A run that cannot ask (`--non-interactive`, CI, piped input) fails with the
   error code `PLUGIN_EULA_REQUIRED` and downloads nothing, and a "no" fails with
   `PLUGIN_EULA_DECLINED`. Pass `--accept-eula` only after the user has read the terms and
   agreed: it is their acceptance, never yours to give. An accepted version is remembered, so an
   upgrade asks again only when the terms changed. `--dry-run` on either command prints the terms
   and what would change, asks nothing, records nothing and downloads nothing. In
   `--format json`, a row for a plugin with terms carries `eula` (`required`, `accepted` or
   `declined`); a plugin with no terms has no such field. A `--dry-run` row also carries `dryRun: true` and an `eulaNotice` object (`version`, `url`,
   `label`, `message`, `links`) with the terms to read. `--quiet` never hides the terms. A notice
   the registry carries but the CLI cannot read refuses the install under `PLUGIN_EULA_REQUIRED`.

   A plugin can need other plugins. `unity plugin install <id>` installs the ones it requires
   first, each with its own license step, and reports each as its own row. If one of them cannot
   install, the plugin itself is not installed, and its row names the one that stopped it.
   `unity plugin remove <id>` refuses a plugin another installed plugin requires: remove the
   other one first. `unity plugin --json` lists each entry's `dependencies` (`id`, `optional`).

3. **Pick up its agent skill in the same session.** A catalog plugin can ship its own agent skill
   inside its payload (`ai` does), and installing the plugin does not, by itself, make that skill
   visible to you; it has to be mirrored the same way this skill itself is:
   ```bash
   unity skill install <client>     # e.g. claude-code, first time this session
   unity skill refresh              # already mirrored earlier? re-render it fresh
   ```
   `unity plugin install`'s own last line already tells you which one applies: it points at
   `unity skill install` right after installing a copy that ships a skill, and at
   `unity skill refresh` once one is already mirrored but the plugin's copy just changed. Confirm
   where it landed with `unity skills --format json` (look for the row whose `skill` field
   names the plugin's own skill, e.g. `unity-ai`, and read its `path`), then read that file before
   driving the plugin's commands. Don't guess its command surface from this skill, which only
   documents `unity` itself.

**A command invoked before any of this** (`unity ai …` typed straight, or suggested from memory)
**fails with a clear, actionable message** naming the exact install command (`unity plugin install
ai`), in both human and machine (`--format json` / `--format ndjson`) output, under the stable
error code `TOOL_NOT_INSTALLED`. Read that message rather than guessing why the command did
nothing; the same shape (`TOOL_UNSUPPORTED_PLATFORM`, `TOOL_RUNTIME_NOT_INSTALLED`) covers the
two other reasons a catalog tool can't run.
