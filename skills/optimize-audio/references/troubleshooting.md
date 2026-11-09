# 6. Troubleshooting

## Stereo clip on a 3D AudioSource — only left channel audible

1. Confirm `audioSource.spatialBlend == 1`.
2. Confirm `audioSource.clip.channels == 2`.
3. Enable `forceToMono` in the AudioClip importer and reimport. Unity mixes both channels to mono during import, preserving level with `normalize = true` (keep on).
4. If the user does not want to reimport: set `audioSource.panStereo = 0` as a runtime workaround, but warn this does not recover stereo information.

## Decompress On Load clip causes memory spike

1. Confirm `clip.loadType == AudioClipLoadType.DecompressOnLoad` and `clip.length` is long (> 5 s).
2. Switch to `Streaming` if it is music or ambience, `CompressedInMemory` if played only occasionally.
3. If the clip is short but still large: check `clip.channels` (stereo wastes double the memory) and `clip.frequency` (high sample rate on a mobile target wastes memory). Apply Force To Mono and/or sample rate override.

## AudioMixer CPU spike — DSP thread hot

1. Confirm with the mixer-asset query recipe that the mixer graph exists.
2. Use `script eval` to list all groups and their attached effects. Look for reverb, chorus, or EQ on high-level groups.
3. Move expensive effects down to leaf groups that are only active when sources are playing.
4. Use snapshots to bypass effect chains during gameplay states where they are not heard (e.g., bypass reverb during a menu).
5. If the DSP buffer is small (64 or 128 samples), raise it — see DSP Buffer Size Guidelines in [resources/platform-settings.md](../resources/platform-settings.md).

## Vorbis quality artifacts on dialogue

1. Confirm `defaultSampleSettings.compressionFormat == AudioCompressionFormat.Vorbis`.
2. Confirm `defaultSampleSettings.quality` — default is 0.5, which is often audible on voice. Raise to 0.7–0.85.
3. On iOS: switch to AAC instead of Vorbis (hardware decode, better quality at equivalent bitrate).
4. Confirm the source file is lossless (WAV or AIFF). MP3 sources cannot recover quality lost before Unity's re-encode.

## AudioListener count is not exactly one

- **Zero listeners:** All audio will be silent. Use `script eval` to add an `AudioListener` component to the main camera: `UnityEngine.Camera.main.gameObject.AddComponent<UnityEngine.AudioListener>()`.
- **Multiple listeners:** Unity uses the last enabled one, producing unpredictable spatialization. Use the scene-component query recipe for `UnityEngine.AudioListener` and disable all but the intended one.

## `Load In Background` causes first-play silence

This is expected behavior: the clip has not finished loading when `Play()` is first called. Mitigate with:
1. Preload the clip at scene start by calling `clip.LoadAudioData()` before it is needed.
2. Use `AudioSource.PlayScheduled()` with a slight delay to allow async load to complete.
3. For AudioSources that must play immediately: switch to `CompressedInMemory` (synchronous on first play) rather than `Streaming` with background load.
