# Read the shipped resources before writing code (REQUIRED)

This skill ships working C# under `resources/`, and the atlas code that goes wrong is almost always
code written without reading it first. Open the files for the path you are taking, then write.

| Taking this path | Read first |
|---|---|
| Any atlas work at all | [resources/authoringvsruntime.cs](../resources/authoringvsruntime.cs), [references/common-errors.md](common-errors.md) |
| Prebuild generation (the default) | [resources/spriteatlasprebuildgenerator.cs](../resources/spriteatlasprebuildgenerator.cs), [resources/enablespritepacking.cs](../resources/enablespritepacking.cs), [resources/savespriteatlasasset.cs](../resources/savespriteatlasasset.cs) |
| Option B, Addressables late-binding | [resources/buildaddressablespostprocess.cs](../resources/buildaddressablespostprocess.cs), [resources/spriteatlaslatebinding.cs](../resources/spriteatlaslatebinding.cs), [resources/handlelatebinding.cs](../resources/handlelatebinding.cs) |
| Anything that might use an older API | [resources/deprecatedmethods.cs](../resources/deprecatedmethods.cs), [resources/dontscriptspriteatlasineditor.cs](../resources/dontscriptspriteatlasineditor.cs), [resources/dontpackinruntimebuilds.cs](../resources/dontpackinruntimebuilds.cs) |

`resources/` holds 38 files in all, covering custom packers, variants, platform settings, and
runtime access. Browse the directory when your task is not in the table above rather than inventing
an approach. Reaching for the API from memory instead of reading these is the single most common
cause of an atlas that imports cleanly and then does nothing at runtime.

