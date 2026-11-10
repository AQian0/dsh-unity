# Final report example

A worked example of the checklist in the skill's Final report section:

```
I made the following changes:

[✓] Set Compression Format to Brotli and Strip Engine Code to on, because the server sends `Content-Encoding: br` over HTTPS.
[✓] Added `Assets/Editor/WebOptimizer.cs`, which applies the release settings from Tools > Apply Web Release Settings.

Follow these steps to finish:

1. Apply `codeOptimization` in your CI build step, because it's stored in `Library/` and doesn't travel with the project.
2. Test the build in Safari, because its garbage collection and JIT behaviour differ from Chrome.
```
