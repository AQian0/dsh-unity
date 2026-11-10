# Graph tool skeleton

The `implement-a-graph-tool.md` and `implement-nodes.md` pages explain this in full. When they cannot
be fetched, start from:

```csharp
[Graph(AssetExtension)] [Serializable]                     // GraphOptions.SupportsSubgraphs as a second argument
class DialogueGraph : Graph
{
    public const string AssetExtension = "dialogue";
    [MenuItem("Assets/Create/Dialogue/Dialogue Graph")]
    static void Create() => GraphDatabase.PromptInProjectBrowserToCreateNewAsset<DialogueGraph>();
}

[Serializable] [Node("Dialogue")]
class LineNode : Node
{
    protected override void OnDefinePorts(IPortDefinitionContext context)
    {
        context.AddInputPort("In").Build();                                       // untyped: execution flow
        context.AddInputPort<string>("Text").Build();
        context.AddOutputPort("Next").WithCapacity(PortCapacity.Single).Build();  // outputs accept many wires by default
    }
}
```

Different port types do not connect unless `Graph.IsConnectionAllowed(IPort output, IPort input)`
allows it; the graph only records the wire, and the importer does the conversion.

### Gotchas

| Symptom | Fix |
|---|---|
| A typed input port refuses a second wire, or an output accepts several | Typed inputs default to `PortCapacity.Single`; untyped ports and outputs to `Multi`. Set `WithCapacity` explicitly |
| `GetInputPortByName` or `GetNodeOptionByName` returns the wrong element or null | Port and option names are lookup keys: keep them unique, share a `const` between `OnDefineOptions` and `OnDefinePorts` |
| Ports rebuild on every keystroke of a count option | `.Delayed()` on the option |
| `AsVertical()` has no effect | Block node ports are always horizontal |
| A node lands in an odd Add-menu folder such as `Math/Add/Add` | The first `[Node]` argument is a folder path; the title is appended to it |
| `OnEnable` runs several times | Expected on load, reopen and domain reload: keep it idempotent |
| Compile error on a class marked `[SerializeReference]` | That attribute is for fields; classes take `[Serializable]` |

