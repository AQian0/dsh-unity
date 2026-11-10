# Completion checklist and related skills

After finishing the audit or optimization:

- Summarize every setting changed with before/after values.
- List any clips or groups that still need attention (e.g., clips that require on-device measurement to confirm savings).
- If the user needs runtime memory measurement, point them at the Memory Profiler package, which reports the largest AudioClips by runtime byte cost.
- If mixer CPU is still high after the audit, point them at the Unity Profiler's Audio module for DSP thread profiling.

## Detailed References

- **Platform settings, compression matrix, load types, sample rates:** [resources/platform-settings.md](resources/platform-settings.md)
- **AudioImporter API recipes and code patterns:** [resources/audio-import-api.md](resources/audio-import-api.md)

## See Also

- **Memory Profiler package** — finds the largest AudioClips by runtime byte cost.
- **Unity Profiler, Audio module** — DSP CPU markers and frame-time budget.
- `audio-setup-mixers` — creating mixers and routing Audio Sources into groups.
