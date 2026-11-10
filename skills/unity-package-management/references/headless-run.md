# Run it headless (direct Editor invocation, no `-quit`)

Resolve the Editor binary from the version, then run it in batch mode. Run it only once no Editor
has the project open (see the fallback's first rule). The script owns quitting via
`EditorApplication.Exit`, so do **not** pass `-quit`:

## Is an Editor holding the project?

`unity editors running --format json` lists every open Editor, with or without the Pipeline package
(`unity status` lists only Pipeline projects, so an empty result there does not mean closed). Compare
each `data.instances[].projectPath` with the target project, and check whether
`<project-path>/Temp/UnityLockfile` exists. Ask the user whether the project is open in an Editor.
If one has it open, or you can't tell, ask the user to save their work and close it and wait until
they say it is closed. If the batch run still fails on a lock, treat the project as open and ask the
user to close it; don't retry or remove the lock file.

## The command

```bash
VERSION="<version>"          # e.g. 6000.0.47f1 (or an installed version)
PROJECT="<project-path>"
METHOD="ProjectBootstrap.PackageInstaller.Install"   # or ...PackageSearch.SearchAll

# Install directory of that editor (Hub layout), via the unity CLI
ED=$(unity editors path "$VERSION" --format json | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['path'])")

# Resolve the executable per-OS (handles both "dir containing Unity.app" and the ".app" itself)
case "$(uname)" in
  Darwin) if [ -d "$ED/Unity.app" ]; then UNITY_BIN="$ED/Unity.app/Contents/MacOS/Unity";
          elif [[ "$ED" == *.app ]]; then UNITY_BIN="$ED/Contents/MacOS/Unity";
          else UNITY_BIN="$ED/Unity"; fi ;;
  Linux)  UNITY_BIN="$ED/Editor/Unity" ;;
  *)      UNITY_BIN="$ED/Editor/Unity.exe" ;;   # Windows (Git Bash / MSYS); use Editor\Unity.exe in PowerShell
esac

"$UNITY_BIN" -batchmode -projectPath "$PROJECT" -executeMethod "$METHOD" -logFile -
echo "Exit code: $?"   # 0 = success, 1 = UPM error, 2 = timeout
```

`-logFile -` streams the Editor log (including the `[PackageInstaller]` / `[PackageSearch]`
lines) to stdout so you can watch resolution progress and read any UPM error. `unity logs` is no
substitute: it shows the CLI's own log, not the Editor's. If
`unity editors path` output shape differs on your build, get the directory from
`unity editors --installed --format json` instead.

## The `-quit` problem — why NOT `unity run` for installs

`Client.Add` / `Client.AddAndRemove` are **asynchronous**: they return a `Request` that only
completes on later `EditorApplication.update` ticks (the UPM child process marshals its result
back on the Editor's main-loop pump, so a blocking `while (!req.IsCompleted)` busy-wait
deadlocks it). The Editor must **stay alive** after `-executeMethod` returns, until the request
finishes.

`unity run` **cannot** be used for the installer: its default path injects `-quit` (see the reserved
flags in the **`unity-cli`** skill). With `-quit`, the Editor quits the instant the method
returns — before UPM resolves — so packages never install and the callback never runs.

**Solution:** launch the **Editor binary directly** in `-batchmode` **without** `-quit`. The
Editor stays alive, `EditorApplication.update` keeps ticking, the poll callback runs, and it
calls `EditorApplication.Exit(code)` itself when done — which both quits and sets the process
exit code. The command above does exactly that.
