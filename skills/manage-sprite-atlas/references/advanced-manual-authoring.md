# Advanced: Manual Authoring (NOT Default - Use Only When Explicitly Requested)

> ⚠ **WARNING**: Manual authoring is NOT the default approach. Only use these patterns when the user EXPLICITLY requests manual control or editor preview during development.

> 🚨 **DEFAULT APPROACH**: Use prebuild generation with `IPreprocessBuildWithReport` instead. See [Quick Start](../SKILL.md#quick-start-automated-prebuild-generation-default-approach).

**Manual authoring is appropriate ONLY for:**
- Hand-optimized sprite layouts where exact positioning matters
- Custom sprite ordering requirements
- Editor preview during authoring workflow
- Explicitly requested by user

**DO NOT use manual authoring when:**
- User asks to "create sprite atlas" (use prebuild)
- User asks to "optimize sprites" (use prebuild)
- User asks for automated workflow (use prebuild)
- No specific manual control requirement mentioned

For complete manual authoring patterns including master atlas creation, variant creation, and runtime loading, see [references/manual-authoring.md](manual-authoring.md).
