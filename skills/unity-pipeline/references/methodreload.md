# Runtime method reload

Change gameplay code in a **running** game with no domain reload. The game must be live:
enter Editor Play Mode (`unity command editor.playmode start`) or run a dev Player. The runtime Pipeline driver (enabled via Project Settings > Pipeline > Runtime) auto-discovers tagged methods on `Awake` (no manual
registration). Mono only — Editor Play Mode and Mono desktop dev builds, not IL2CPP. The token
is auto-injected for local requests.

### `script.methodreload reload`

Edit the method body directly; no separate file, no boilerplate.

1. **Before entering Play Mode**, tag the method `[MethodReload]` on the MonoBehaviour and recompile.
   The reload hook is compiled into the method, so tagging it while the game runs has no effect:
   exit Play Mode, recompile, and enter it again.
2. With the game running, edit the method body on disk.
3. Apply (re-run to iterate):
   ```bash
   unity command script.methodreload reload --filename Assets/Spinner.cs
   ```
   Add `--pdb` to debug it: it emits a portable PDB mapped to your source so breakpoints bind
   (attach the IDE + enable Editor Attaching; compiles unoptimized). Without it, no symbols.

Constraints: `void` instance methods only; **public** members only.

`unity command script.methodreload status` shows active overrides. `reload` options: `--timeout
<seconds>` (default 60; the CLI's `--timeout` is the command's own), `--assembly-dir <dir>` (persist
DLLs instead of in-memory); `script.methodreload cleanup --assembly-dir <dir>` clears old DLLs.

