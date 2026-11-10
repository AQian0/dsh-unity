# Final report example

A worked example for the checklist in `SKILL.md`:

```
I made the following changes:

[✓] Created `Editor/DialogueGraph.cs`: the graph class registered on the `.dlg` extension.
[✓] Created `Editor/DialogueNode.cs`: a start node and a line node with text and next ports.
[✓] Created `Editor/DialogueImporter.cs`: compiles the graph into a `DialogueRuntimeGraph` asset.

To create your first graph:
1. Right-click in the Project window > Create > Dialogue > Dialogue Graph.
2. Double-click the asset to open the graph window.
3. Add a Start node and a Line node from the Add menu and connect them.
4. Save. The Inspector should show the compiled `DialogueRuntimeGraph` as the main asset.

Still to decide:
- More node types (choice branches, wait, end).
- The runtime executor (a MonoBehaviour that walks the runtime asset).
- A live debug view using the GraphVisualization API.
```
