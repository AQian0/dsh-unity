# 6. Play Mode vs. Multiplayer Play Mode (MPPM) scenarios

These are two different things — do not conflate them.

## Single-player: normal Play Mode (main Editor only)

```bash
unity command editor.playmode start    # enter Play Mode
unity command editor.playmode pause    # toggle pause
unity command editor.playmode stop     # exit Play Mode
```

`editor.playmode start` runs the main Editor's **open scene** in Play Mode: **one** instance, never
MPPM virtual players, even if configured. Use it for single-instance testing and method reload.

## Multiplayer: Play Mode Scenarios (main Editor + virtual players)

A **Play Mode Scenario** is an asset (an `OrchestratedScenario`, e.g.
`Assets/Settings/PlayMode/2Players.asset`) describing the main Editor plus one or more virtual
players. Each virtual player (clone) is a **separate Unity project** at
`<project>/Library/VP/<vpId>` with its **own Library, port, and Pipeline server** — not a second
window of the main Editor. Run a scenario with the scenario commands (they drive MPPM's
`PlayModeScenarioManager`, which enters Play Mode itself), never with `editor.playmode start`,
which fights MPPM's play-mode guard:

```bash
unity command editor.playmode list_scenarios         # discover scenario assets
unity command editor.playmode list_players # players the active scenario declares
unity command editor.playmode set_active_scenario --path Assets/Settings/PlayMode/2Players.asset
unity command editor.playmode start_scenario        # run the active scenario
unity command editor.playmode get_scenario_status       # live scenario + play-mode state
unity command editor.playmode stop_scenario         # stop it
```

Authoring the asset (Edit Mode):

```bash
unity command editor.playmode create_scenario --name MyScenario # auto-adds the Main Editor player
unity command editor.playmode add_player --path Assets/Settings/PlayMode/MyScenario.asset --type clone --name "Player 2"
unity command editor.playmode remove_player --id <playerId> --path Assets/Settings/PlayMode/MyScenario.asset --confirm true  # id: GUID on 6000.5+, player name on 6000.3/6000.4
```

MPPM has four player slots, and slot 0 (`Player 1`) is always the Main Editor. A scenario therefore
holds at most **3 clones** (`Player 2`–`Player 4`): a 4-player scenario is the Main Editor plus 3 clones,
and a fourth clone is refused. For more players, add built players with `--type local`.

The `editor.playmode` scenario commands need **Unity 6000.3+** *and* the `com.unity.multiplayer.playmode`
package. Without both they are compiled out and calling one fails as an unknown command, so run
`unity command editor.playmode` and check that `start_scenario` and the other scenario commands are listed
before using them. The group itself always exists: `editor.playmode list_instances` needs neither
and always works. You may only `editor.playmode set_active_scenario` while state is **Idle**.

Player editors launch **asynchronously**, so after `editor.playmode start_scenario` poll
`editor.playmode get_scenario_status`. Its `players` array has one entry per player the scenario declares — not
MPPM's fixed four slots — and each entry carries both `state` (`NotLaunched` / `Launching` /
`Launched` / `UnexpectedlyStopped`) and, once that player's Editor is up, `reachable: true` with the
`port` and `projectPath` you need to drive it. Wait for `reachable`, then address it with
`--project-path`. Watch `state` to tell a slow launch (`Launching`) from a dead one
(`UnexpectedlyStopped`) — a missing descriptor alone cannot distinguish those.

## Discovering and driving the clones

The CLI folds a project's own clones into its main Editor, so a running scenario adds no
ambiguity by itself. But with another Unity project open, `unity command` with no `--project-path`
picks the Editor whose project contains the current directory (and fails as ambiguous outside
both). When more than one project is open, pass `--project-path <mainProject>` to the main Editor
commands above. Each clone runs its own server, so address one by its project directory:

```bash
# List every running instance (main + clones): role, port, pid, vpId, projectPath
unity command editor.playmode list_instances

# Talk to a clone directly, using the projectPath that listed it
unity command --project-path <mainProject>/Library/VP/<vpId> editor status
# Each clone is its own Editor: keep it ticking before running tests on it
unity command --project-path <mainProject>/Library/VP/<vpId> editor set_auto_tick --enabled true
unity command --project-path <mainProject>/Library/VP/<vpId> test run --mode playmode
```

`unity pipeline list` also reports clones, named by player ("Player 2") against the project they're
playing. There is no forwarding command — talk to the clone. That way you get its full command
surface and its own status, and nothing queues behind the main Editor.

## Multiplayer Roles (client / server stripping)

Multiplayer Roles decide what is stripped from a client or a server: the Editor runs as one role in
Play Mode, and each GameObject or component is kept for some roles and stripped from the others.
Use the `multiplayer.role` commands rather than reflecting over `EditorMultiplayerRolesManager` in
`script eval`:

```bash
unity command settings.multiplayer_roles get                    # enabled? safety checks, server stripping
unity command settings.multiplayer_roles set --settings '{"enabled":true}' --confirm true  # nothing is stripped until roles are enabled
unity command multiplayer.role get_active                       # Editor role, and whether roles are enabled
unity command multiplayer.role set_active --role server         # role the Editor plays as (Edit Mode only)
unity command multiplayer.role set_game_object --target <go> --role server                       # the GameObject
unity command multiplayer.role set_component --target <go> --type AudioSource --role client      # one of its components
unity command multiplayer.role set_component --target <component handle> --role client          # a component by handle
unity command multiplayer.role set_build --role server          # role the active build profile builds for
```

`role` is `client`, `server` or `client_and_server`. The group needs **Unity 6000.6+**; on older
Editors it is compiled out, so run `unity command multiplayer.role` to check it is listed.
