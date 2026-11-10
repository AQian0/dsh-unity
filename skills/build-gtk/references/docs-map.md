# Graph Toolkit documentation map

The docs are online at `https://docs.unity.com/en-us/engine/<VERSION>/`. Replace `<VERSION>` with the
project's Editor version from `ProjectSettings/ProjectVersion.txt`, for example `6000.6` or `6000.7`.
Pages are served as markdown when the `.md` suffix is kept. Prefer `WebFetch` over `WebSearch`; it is
faster and lands on the exact page. Only fetch what you need.

- **GTK index**: `manual/extending-the-editor/gtk-index.md`, the landing page for all GTK manual topics
  - **Implementing a graph tool**: `manual/extending-the-editor/gtk-index/implementing-a-graph-tool.md`,
    with these pages under it:
    - `implement-a-graph-tool.md`: graph class, asset creation, menu item
    - `implement-nodes.md`: node class, `OnDefinePorts`, discovery rules
    - `implement-node-options.md`: `IOptionDefinitionContext`, `Delayed`, `ShowInInspectorOnly`
    - `implement-context-nodes.md`: `ContextNode`, `BlockNode`, `UseWithContext`
    - `implement-block-nodes.md`: block port rules, horizontal-only ports
    - `type-cast-ports.md`: `IsConnectionAllowed`, cross-type connections
    - `add-custom-toolbar-actions.md`: `GraphToolbarElement`, `IGraphWindow`
    - `add-subgraph-support.md`: `GraphOptions.SupportsSubgraphs`, subgraph ports from Blackboard variables
    - `graph-processing.md`: `OnGraphChanged`, `GraphLogger`, `GraphLogAction`, fix buttons
  - **Graph window and panels**: `manual/extending-the-editor/gtk-index/landing-graph-interface.md`, with
    `graph-window.md`, `blackboard.md`, `graph-inspector.md` and `minimap.md` under it
  - **Debug graph view** (manual from `6000.7`; the API is the same on 6.6):
    `manual/extending-the-editor/gtk-index/landing-implementing-debug-graph-view.md`, with
    `concept-graph-visualization.md`, `task-display-node-progress.md`, `task-display-port-values.md`,
    `task-display-errors-in-graph.md` and `task-customize-wire-display.md` under it
- **Samples**: `https://docs.unity3d.com/Packages/com.unity.graphtoolkit-samples@<PKG_VERSION>/manual/index.html`.
  Install `com.unity.graphtoolkit-samples` by name in the Package Manager, replace `<PKG_VERSION>` with
  the version shown there, then import Texture Maker (importer), Visual Novel Director (runtime and live
  debug view) or Dungeon Graph Generator (building a graph from code).
- **Community**: `https://discussions.unity.com/tag/graph-toolkit`, for known issues and workarounds not
  yet in the docs.

### API reference

Exact type names per API and how to build a Script Reference URL or read the local HTML copy: [api-reference.md](references/api-reference.md).

