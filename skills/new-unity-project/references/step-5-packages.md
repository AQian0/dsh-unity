# Step 5 — Packages

Map the brief to a package list and install via **`unity-package-management`** (**never**
hand-edit `manifest.json`): `package add` once the Editor is open with `com.unity.pipeline`
(Step 7); its C# installer script when packages must land pre-open (the `-quit` gotcha applies).
That skill has the genre/platform/monetization → package mapping. A `--bare` run installs only the
packages the user named, through the C# installer script (bare has no `com.unity.pipeline`, so
`package add` can't run; never `unity pipeline install` to get it, which undoes the bare ask), and
stops there. Otherwise paved
adds the floors' needs: Cinemachine for any gameplay camera (2D rigs included);
`com.unity.services.authentication` when Step 6 wires identity; and the live floor's services set
on cloud-linked projects — in this pass, not at shell time. Cloud save and remote config come from
create: when its `steps` report `cloudSave` and `remoteConfig` as `done` or `present`, skip them and
add only what is left (leaderboards). The template already provides the
render pipeline — never add `com.unity.render-pipelines.universal` on a Built-in template
(materials go pink) or vice versa. Read the list back before installing (paved: print it now);
verify `manifest.json` after.

