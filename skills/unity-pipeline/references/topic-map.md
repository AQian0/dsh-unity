# Pipeline topic map

The Pipeline package ships its documentation in its `Documentation~` folder. For a registry install
that is `<project>/Library/PackageCache/com.unity.pipeline@*/Documentation~/`; the same pages are
published at `https://docs.unity3d.com/Packages/com.unity.pipeline@<VERSION>/`. Only read what you need.

Prefer the local copy: it matches the installed package. For the live pages, fetch the exact URL
rather than searching; `<VERSION>` is the major.minor of `com.unity.pipeline` in
`Packages/packages-lock.json`, e.g. `@0.9`.

| Topic | Page |
|-------|------|
| Connecting to an Editor or Player, ports, `--project-path` | `connectivity.md` |
| Dev Player and Runtime server setup | `runtime-setup.md` |
| Method reload (`[MethodReload]`, `script.methodreload`) | `method-reload.md` |
| `script run`, `script eval`, `script recompile` | `commands/scripts.md` |
| Compiling and running tests | `commands/build-and-compilation.md` |
| `editor status`, `editor set_auto_tick`, modal dialogs | `commands/editor-lifecycle-and-observability.md` |
| Play Mode scenarios, virtual players, clones | `commands/multiplayer-play-mode.md` |
| Screen capture | `commands/capture.md` |
| `console get` / `console status`, Runtime commands | `commands/runtime.md` |
