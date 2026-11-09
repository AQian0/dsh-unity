# API reference

If the Editor install folder has a `Data/Documentation` folder (for example
`.../Unity/Hub/Editor/6000.6.0f1/Editor/Data/Documentation`), read the HTML files in its
`en/ScriptReference` folder. Otherwise the Script Reference is online:

```
https://docs.unity.com/en-us/engine/<VERSION>/script-reference/unity/graphtoolkit/editor/<typename>.md
```

Type names are all lowercase with generic arity dropped (`condition.md` for `Condition<T>`). Member
pages nest one level deeper: `.../graph/ongraphchanged.md`. The older HTML form also resolves:
`https://docs.unity3d.com/<VERSION>/Documentation/ScriptReference/Unity.GraphToolkit.Editor.<Type>.html`.

**Graph API (6.6+):** `Graph`, `GraphDatabase`, `GraphOptions`, `GraphLogger`, `GraphLogAction`,
`GraphChanges` (6.7), `ChangedNode` (6.7), `ChangeKind` (6.7), `Node`, `NodeAttribute`, `NodeView<T>` (6.7), `IPort`, `IPortDefinitionContext`,
`IInputPortBuilder`, `IOutputPortBuilder`, `PortCapacity`, `PortConnectorUI`, `PortDirection`,
`INodeOption`, `IOptionDefinitionContext`, `ContextNode`, `BlockNode`, `UseWithContext`, `UseWithGraph`,
`ISubgraphNode`, `Subgraph` (attribute), `IVariable`, `IVariableNode`, `VariableKind`, `IConstantNode`,
`IGraphWindow`, `GraphToolbarElement`, `GraphMenu` (6.7), `BlackboardMenu` (6.7), `Wire`

**State Machine API (6.7+):** `StateMachine`, `StateMachineDatabase`, `StateMachineOptions`,
`StateMachineLogger`, `StateMachineLogAction`, `StateMachineChanges`, `State`, `StateAttribute`,
`StateView<T>`, `IState`, `ITransition`, `ITransitionRule`, `ICondition`, `IGroupCondition`,
`GroupConditionOperation`, `IVariableCondition`,
`Condition`, `Condition<T>`, `ConditionAttribute`, `ConditionView<T>`, `ConditionComparison`,
`SelfTransition`, `TransitionAttribute`, `ISubgraphState`, `StateMachineMenu`, `ConditionMenu`,
`UseWithStateMachine`

**GraphVisualization API (6.6+),** namespace `Unity.GraphToolkit.Editor.GraphVisualization`, pages
under `.../graphvisualization/<typename>.md`: `Registry`, `Context`, `GraphMotion`, `NodeReference`,
`PortReference`, `WireReference`, `StateReference` (6.7), `TransitionReference` (6.7),
`ConditionReference` (6.7)
