# 4A. Force To Mono and Spatial Settings

For any AudioSource where `spatialBlend > 0` (3D positioned sound):

1. **Check clip channel count:** Use `script eval` to read `audioSource.clip.channels`. If `channels == 2` and `spatialBlend == 1`, only the left channel plays — this is a bug, not a feature.
2. **Recommend Force To Mono:** Use the read importer recipe in [resources/audio-import-api.md](../resources/audio-import-api.md) to inspect current settings, then apply Force To Mono using the force-to-mono recipe.
3. **Apply and reimport:** Report before/after channel counts to the user.
4. **Verify spatial blend:** Use `script eval` to confirm `audioSource.spatialBlend` is `1.0` (full 3D) and `audioSource.rolloffMode` is set to an appropriate curve.

# 4B. AudioMixer Audit

1. **Measure group depth:** Use `script eval` to walk the mixer's group tree and count levels. More than 3 levels (Master → SFX / Music / Voice → sub-bus) adds routing overhead every frame, even when children are silent.
2. **Check effects on silent groups:** Use `script eval` to query each group's effects list. Effects such as `AudioReverbFilter` run their DSP at full cost even when no AudioSource routes to that group.
3. **Flag SFX Reverb on parent groups:** This is the most expensive built-in effect. If found on the Master or a high-level group, flag it explicitly.
4. **Present recommendations to the user:**
   - Remove or bypass effects on groups that have no active sources.
   - Use **snapshots** to switch mix states (combat / explore / pause) rather than toggling effects at runtime.
   - Flatten unnecessary sub-buses; redirect sources to a shallower ancestor.

   **WAIT for the user to approve the mixer changes before applying.**

5. **Verify DSP buffer size:** If `bufferLength` from Pre-Flight is very small (< 256), recommend increasing it — see DSP Buffer Size Guidelines in [resources/platform-settings.md](../resources/platform-settings.md).

# 4C. Compression Quality Tuning

1. **Read current compression format:** Use the read importer recipe in [resources/audio-import-api.md](../resources/audio-import-api.md) to read `compressionFormat` and `quality` for the clips reported by the user.
2. **Apply the platform matrix:** See the Compression Format Matrix in [resources/platform-settings.md](../resources/platform-settings.md) for per-platform recommendations.
3. **Warn about lossy sources:** Use the lossy source check recipe in [resources/audio-import-api.md](../resources/audio-import-api.md). If the original file is MP3, warn the user that lossy source quality is lost permanently after Unity re-encodes. Recommend WAV or AIFF sources.

# 4D. Mobile Sample Rate Override

1. **Identify SFX clips on mobile target:** Use the scene-component query recipe for `UnityEngine.AudioSource` and filter for non-music, non-dialogue clips.
2. **Read current sample rate setting:** Use the read importer recipe in [resources/audio-import-api.md](../resources/audio-import-api.md) to read `sampleRateSetting` and `sampleRateOverride` for each clip.
3. **Apply mobile override:** Use the sample rate override recipe in [resources/audio-import-api.md](../resources/audio-import-api.md). See Sample Rate Recommendations in [resources/platform-settings.md](../resources/platform-settings.md) for per-use-case rates.
4. **Report savings:** Halving the sample rate halves the PCM memory cost. Report the estimated saving for each clip changed.

# 4E. Load Type and Streaming

1. **Audit Load Type per clip:** Use `script eval` to read `clip.loadType` for each clip found in Section 2.
2. **Apply the decision rule:** See Load Type Decision Table in [resources/platform-settings.md](../resources/platform-settings.md).
3. **Flag mismatches:** See Load Type Mismatch Flags in [resources/platform-settings.md](../resources/platform-settings.md). Report both types of mismatches to the user.
4. **Apply `Load In Background`** for any Streaming clip — use the Load In Background recipe in [resources/audio-import-api.md](../resources/audio-import-api.md).
