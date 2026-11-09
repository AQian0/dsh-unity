# 5. C# eval (Editor or dev Player)

`script eval` compiles C# as a script: `using` lines, top-level methods and types, and `await`. The
value of `return x;` or of a trailing expression is the result. It targets the Editor by default;
add `--runtime <process name>` to run it in a dev Player. Put anything longer than a line or two in
a file.

```bash
unity command script eval --caller plugin --skill unity-pipeline "return 2 + 2;"
unity command script eval --caller plugin --skill unity-pipeline "return UnityEngine.Time.timeScale;" --runtime MyGame
# A .cs file on disk. Keep it outside Assets/, where Unity would compile it as project source:
unity command script eval --caller plugin --skill unity-pipeline --file AgentScripts/Scratch.cs
unity command script eval --caller plugin --skill unity-pipeline --file AgentScripts/Scratch.cs --dry-run          # compile only
unity command script eval --caller plugin --skill unity-pipeline "return EditorSceneManager.GetActiveScene().name;" --auto-import   # adds missing usings
unity command script eval --caller plugin --skill unity-pipeline "return UnityEditor.LogEntries.GetCount();" --internals             # Editor internal APIs
```

- `await Wait.Until(() => condition)` waits without blocking the Editor; `Wait.For(asyncOperation)`
  and `Wait.ForImport(assetPath)` cover operations and imports. Submit a long wait with `--detach`,
  then `unity job wait <job-id>`.
- A failed eval exits 6 with an `errorCode`: `COMPILATION_ERROR` (each error with its line and
  column), `RUNTIME_EXCEPTION` (exception and stack trace), `TIMEOUT` or `INVALID_COMMAND_ARGS`.
- `script eval_file` is deprecated; use `script eval --file`.
