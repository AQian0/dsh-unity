# Run it headless (direct Editor invocation, no `-quit`)

Resolve the Editor binary from the version, then run it in batch mode. Run it only once no Editor
has the project open (see the fallback's first rule). The script owns quitting via
`EditorApplication.Exit`, so do **not** pass `-quit`:

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
lines) to stdout so you can watch resolution progress and read any UPM error. If
`unity editors path` output shape differs on your build, get the directory from
`unity editors --installed --format json` instead.
