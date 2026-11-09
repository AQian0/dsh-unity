# Step 3: Where the docs stop

The manual covers the 6.6 Graph API. These parts have no manual page yet, so read the reference file
before writing code. Paths are relative to this skill's folder.

- **Importer to a runtime asset, and wiring the debug view from runtime code:** [`references/runtime-and-visualization.md`](runtime-and-visualization.md).
  The importer always has this shape:

  ```csharp
  var graph = GraphDatabase.LoadGraphForImporter<MyGraph>(ctx.assetPath);    // never LoadGraph here
  if (graph == null) return;                                                  // bad path or type: log and stop
  var start = graph.GetNodes().OfType<StartNode>().FirstOrDefault();
  if (start == null) return;                                                  // OnGraphChanged already reported it
  var next = start.GetOutputPortByName("Next").FirstConnectedPort?.GetNode(); // null when unconnected
  var titlePort = next.GetInputPortByName("Title");
  titlePort.TryGetValue<string>(out var title);                               // the value typed on the node
  if (titlePort.IsConnected) { /* resolve titlePort.FirstConnectedPort.GetNode() upstream instead */ }
  ctx.AddObjectToAsset("Runtime", runtime); ctx.SetMainObject(runtime);
  ```

  The runtime asset keeps `Hash128` IDs as `Hash128` and never references `Unity.GraphToolkit.Editor`.
- **State machines (6000.7+):** [`references/state-machine-api.md`](state-machine-api.md). The core types:

  ```csharp
  [StateMachine(AssetExtension)] [Serializable]
  class EnemyBrain : StateMachine
  {
      public const string AssetExtension = "enemybrain";
      [MenuItem("Assets/Create/AI/Enemy Brain")]
      static void Create() => StateMachineDatabase.PromptInProjectBrowserToCreateNewAsset<EnemyBrain>();
  }

  [Serializable] class Patrol : State { }                     // no ports; the state machine owns transitions

  [Serializable] [Condition("Distance to player")]
  class DistanceCondition : Condition<float>                  // derive from Condition for a valueless trigger
  {
      protected override bool DisplayComparisonDropdown => true;
  }
  ```

  Validation goes in `OnStateMachineChanged(StateMachineLogger)`. An importer walks
  `GetStates()`, each state's `GetOutgoingTransitions()`, each transition's `GetRules()` and each rule's
  `RootCondition`. That tree always contains built-in conditions, so handle `IGroupCondition` (recurse,
  honor `Operation`, a `GroupConditionOperation` of `And` or `Or`) and `IVariableCondition` before matching custom `Condition<T>` types.
- **Knowing what changed, and the other 6.7 Graph API additions:** [`references/graph-api-gaps.md`](graph-api-gaps.md).
  On 6000.7+, `logger.GraphChanges.ChangedNodes` reports added and modified nodes. Removed nodes are
  never reported, so on every version, and for all changes on 6000.6, diff a `[NonSerialized]`
  `HashSet<Hash128>` of node IDs against `GetNodes()`.
