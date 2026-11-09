# 3. Install LevelPlay SDK via UPM

**If the SDK looks already installed:** do not take that on trust, and do not ask the user to read
the Package Manager window for you. Read `Packages/packages-lock.json` and look for
`com.unity.services.levelplay`. If it is there, say which version resolved and proceed to Step 4.
If it is not, it is not installed, whatever the conversation so far has assumed: continue with the
install below.

Guide through installing the LevelPlay Unity package using Unity Package Manager:

1. Open Unity → Window > Package Manager
2. Select Unity Registry dropdown or Services tab
3. In the Package Manager search bar, type **Ads Mediation**
4. Confirm the package name matches exactly: the correct package is titled **Ads Mediation**. Do not install either of these packages:
   - **Ads IAP Mediation Adaptor** (a separate in-app purchases package, not the LevelPlay SDK)
   - **Advertisement Legacy** (a deprecated package, not compatible with the current LevelPlay integration)
5. Click Install button
6. Wait for package to download and import

When you install the package, you may see a prompt to install Mobile Dependency Resolver — click **Import** if it appears. This is covered in more detail in the next step.

**Then verify it resolved, by reading the project rather than by asking.** The package id is
`com.unity.services.levelplay` (its Package Manager display name is **Ads Mediation**; the id is
what the project files record). Check both files:

- **`Packages/manifest.json`** lists what the project *asks for*. `com.unity.services.levelplay`
  must appear under `dependencies`.
- **`Packages/packages-lock.json`** records what Unity actually *resolved*. The same id must appear
  here too, with a concrete version. This is the file that answers "did it install", and it is the
  one to trust.

Both are plain JSON in the project, so this check needs no Editor, no CLI, and nothing from the
user. Read them.

> **This is a hard gate, not a formality.** Do not write, generate, or paste a single line of
> LevelPlay code until `com.unity.services.levelplay` is present in `packages-lock.json`. Skipping
> ahead produces code that looks correct, compiles nowhere, and fails with `CS0246` on every
> LevelPlay symbol. If the id is missing from `manifest.json`, the install never happened. If it is
> in `manifest.json` but not `packages-lock.json`, Unity has not resolved it yet: the Editor may
> still be importing, or resolution failed. Say which of the two you found, and stop.
>
> **If you added the id to `manifest.json` yourself and no Editor has run since, the lock file will
> not show it yet. That is expected, not a failure.** Never write the entry into
> `packages-lock.json` yourself: that file is Unity's resolution output, hand-editing it is what the
> migration guide forbids, and an entry you wrote is a false "resolved" signal rather than a passed
> gate. Ask the user to open the Unity Editor so resolution runs, then re-read the file. If no
> Editor is available at all, say so and stop there rather than manufacturing the evidence.

Report the resolved version you found. Do not report "installed" on the strength of the Package
Manager window, a previous turn, or a user's recollection.

**Network Manager:** Access **Ads Mediation > Network Manager** at any time to install additional ad network adapters and check for SDK and adapter updates.

For iOS builds, note that SKAdNetwork configuration will be needed later (reference `references/ios-setup.md` when ready for iOS builds).

