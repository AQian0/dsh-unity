---
name: build-gtk
description: >-
  Builds graph tools with Unity Graph Toolkit (GTK) on 6.6+, state machines on 6.7+, and importers for
  runtime assets. Use this skill for graph, node or state machine editors, or GraphView migrations. Not
  for Shader Graph, VFX Graph or Animator.
required_editor_version: ">=6000.6"
---

# Unity Graph Toolkit (GTK)

Build Editor graph tools and state machine tools on Unity's Graph Toolkit module, using only its
public API in the `Unity.GraphToolkit.Editor` namespace.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for
  each step.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask
  for. See [Final step](#final-step).
- Avoid long explanations.
- **Graph Toolkit is a built-in module, not a package.** Never add `com.unity.graphtoolkit` to the
  manifest; it is a deprecated shim. Editor code needs no asmdef reference to use it.
- **Use only the public API.** If a draft uses any name from the left column, stop and rewrite it with
  the right column:

  | Never write | Write instead |
  |---|---|
  | `GraphModel`, `GraphObject`, `GraphTool`, `Stencil`, `BaseGraphTool` | `Graph` and `GraphDatabase` |
  | `NodeModel`, `PortModel`, `WireModel` | `Node`, `IPort`, `Wire` |
  | `StateModel`, `TransitionModel`, `ConditionModel` | `State`, `ITransition`, `Condition<T>` |
  | `GraphViewEditorWindow`, `GraphElementsExtensionMethodsCache`, `ModelView` | the window is provided; `NodeView<T>` on 6000.7+ for custom UI |
  | `UnityEditor.Experimental.GraphView`, `graphViewChanged`, `Port.Create` | model the tool as `Graph` and `Node` classes; track changes in `OnGraphChanged` |
  | `com.unity.graphtoolkit` in the manifest | nothing; the module is built in |

- **Spell members exactly.** Properties are PascalCase (`FirstConnectedPort`, `IsConnected`),
  attributes take positional arguments, and IDs are `Hash128`, not strings. Look up any member you
  have not seen in the docs or references instead of guessing it.
- **Every authoring class is `[Serializable]`** (graph, node, state, condition, self transition) and
  lives in Editor-only code. Otherwise nodes reset or vanish after a domain reload.
- **Keep runtime assemblies free of `Unity.GraphToolkit.Editor`.** Guard visualization calls with
  `#if UNITY_EDITOR`, because the module is Editor-only and any reference to it breaks the player build.
- **Use `LoadGraphForImporter` (not `LoadGraph`) inside a `ScriptedImporter`.** The state machine
  equivalent is `StateMachineDatabase.LoadStateMachineForImporter<T>`.
- **Wrap every programmatic edit** in `UndoBeginRecordGraph` / `UndoEndRecordGraph` and call
  `GraphDatabase.SaveGraph`. Never mutate the graph inside `OnEnable`, `OnDisable` or `OnGraphChanged`;
  it throws `InvalidOperationException`.

## Step 1

Before you go forward with a workflow or diagnosis:

1. Get the Editor version from the user's message, or else from `m_EditorVersion` in
   `ProjectSettings/ProjectVersion.txt`, and pick the API from the table below. A version the user
   names wins over a newer project. Ask only when neither gives it.
2. Open and read the [documentation page(s)](#topic-map) that cover what you intend to do or fix. Where
   the manual has no page, read the reference file named in [Step 3](#step-3-where-the-docs-stop).
3. Name the file(s) you read in your response.

A missing Unity project or unreachable docs do not block the answer: write the code from this skill
and its references, say where each file goes, and name what you could not check.

This is because your training knowledge about Unity might be out of date, incorrect, or for the wrong
Unity version. Graph Toolkit changed significantly between 6000.4, 6000.6 and 6000.7.

| Editor version | Available |
|---|---|
| Older than 6000.4 | Only the retired experimental package (0.x). Its API differs from this skill. Recommend upgrading. |
| 6000.4 to 6000.5 | Module present, but without port capacity, type casting, wire and node visualization, USS node styling, or element IDs. |
| 6000.6 | The Graph API. |
| 6000.7 and newer | Everything above plus the State Machine API, `NodeView<T>` / `StateView<T>` / `ConditionView<T>` custom UI, `[GraphMenu]` / `[BlackboardMenu]` context menus, the `GraphLogger.GraphChanges` change delta, polymorphic and type-following ports, and Blackboard type restriction. |

If the user asks for a state machine tool on an Editor older than 6000.7, say plainly that the State
Machine API is not available there. Do not emulate it with the Graph API unless asked.

## Step 2: Start from the graph tool skeleton

The minimal `Graph` + `Node` skeleton, the port-capacity rules and the port/option
gotchas are in [graph-skeleton.md](references/graph-skeleton.md). Read it when
`implement-a-graph-tool.md` and `implement-nodes.md` cannot be fetched, or when a
port, option or Add-menu placement behaves unexpectedly.

## Step 3: Where the docs stop

Read before writing importer, state machine or change-tracking code: these parts have no manual page, and the code shapes you need are in [where-the-docs-stop.md](references/where-the-docs-stop.md).

## Topic map

The GTK manual, samples and community links are collected in
[docs-map.md](references/docs-map.md). Use the Editor version from
`ProjectSettings/ProjectVersion.txt` in the docs URL and prefer `WebFetch` over
`WebSearch`.

## Final step

1. Confirm the Console has zero errors (`unity command console status` for counts; without the CLI,
   ask the user to select the Editor and report the Console).
2. Create an asset from the new menu item, add every node or state type from the Add menu, connect
   them, save, close and reopen. No errors or warnings. A missing type is abstract, generic, or in
   another assembly without `[UseWithGraph]` / `[UseWithStateMachine]`.
3. With an importer, confirm the produced runtime object is the main asset.
4. Stop there unless the user asked you to prove it works or you suspect a specific fault. If you do
   enter Play mode, do it once, and read the world with `unity command script eval --caller plugin
   --skill build-gtk` instead of adding logging.

If a check fails, reread the docs page from [docs-map.md](references/docs-map.md) or the reference
file for that step.

## Final report

Give the user a concise but not dense checklist of what you did and why. If the user needs to follow up
with more steps or decisions, list them. For example:

A worked example is in [final-report-example.md](references/final-report-example.md).
