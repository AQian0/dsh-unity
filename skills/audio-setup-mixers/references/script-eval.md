# Passing C# to `script eval`

`script eval` compiles a **statement block, not a file**. Two consequences, both of which cause a
compile error rather than a warning:

- **No `using` directives.** The compiler reads `using UnityEngine;` as a resource-disposal
  statement and rejects it (`CS0210`).
- **Types must be fully qualified.** A bare `AssetDatabase` or `Volume` does not resolve
  (`CS0246` / `CS0103`), and a bare `Object` is ambiguous with `object` (`CS0104`).

Where a snippet below is written as a file — with usings, for readability, or because it is
meant to be saved into the project — qualify the types before passing it to `script eval`.

