# Notes when translating an existing project
- **Minimal Code Changes**: Never modify code unrelated to localization. Use a static helper class (e.g., `L10n`) to wrap `LocalizationSettings.StringDatabase.GetLocalizedString` for easy injection into existing scripts.
- **Robust Mapping Strategy**: When mapping existing UI text to keys, sort keys by string length (descending) and match longest strings first. This prevents short strings (like "NO") from matching parts of longer sentences. Use case-insensitive matching where appropriate.
- **Component Event Listeners**: wire `LocalizeStringEvent.OnUpdateString` with
`UnityEventTools.AddPersistentListener`, passing a delegate built over the text component's public
`text` setter. The setter has no C# method-group name, so build the delegate by name:
`(UnityAction<string>)Delegate.CreateDelegate(typeof(UnityAction<string>), text, "set_text")`.
That is reflection over a **public** member, which is fine. See
[scripts/L10nBatchProcessor.cs](../scripts/L10nBatchProcessor.cs) for the working version, including
clearing any existing persistent listeners first so repeated runs don't stack duplicates.
  - Do **not** write the persistent-call fields directly through `SerializedObject` (`m_MethodName`,
    `m_Mode`, `m_PersistentCalls`). Those are private serialized names with no compatibility
    guarantee, and it isn't necessary: `AddPersistentListener` with the delegate above produces the
    same serialized call (target = the text component, method = `set_text`, mode = `EventDefined`).
  - **You must then set the call state, or the label will not update in the Editor.**
    `AddPersistentListener` leaves the call at `UnityEventCallState.RuntimeOnly`, so the binding is
    correct but dormant outside Play mode: switching locale in the Editor changes nothing, and it
    stays that way through a save and reload. Fix it with the public
    `UnityEventBase.SetPersistentListenerState`:
    ```csharp
    UnityEventTools.AddPersistentListener(lse.OnUpdateString, setText);
    var index = lse.OnUpdateString.GetPersistentEventCount() - 1;
    lse.OnUpdateString.SetPersistentListenerState(
        index, UnityEngine.Events.UnityEventCallState.EditorAndRuntime);
    ```
  - Persistent listeners **MUST** point to a method on a `UnityEngine.Object`; lambdas will fail.
  - **Then confirm the binding is live, don't assume it.** Wiring that looks right in the Inspector
    but does nothing is the characteristic failure of this step. All of the read-back you need is
    public API on the event, so none of this requires touching serialized fields:

    | Check | Call | Expect |
    |---|---|---|
    | Something was wired | `GetPersistentEventCount()` | `> 0` |
    | It points at the text component | `GetPersistentTarget(i)`, `GetPersistentMethodName(i)` | the component, `set_text` |
    | It will fire while authoring | `GetPersistentListenerState(i)` | `EditorAndRuntime` |
    | It actually updates the label | `lEvent.RefreshString()` | the text value changes |

    Do all four, because a binding that is wired but never fires reads as done while leaving the
    label unlocalized.
- **Initialization & Refresh**: 
    - `LocalizationEditorSettings.CreateStringTableCollection` expects a **directory path** (e.g., `Assets/Localization`), not a full asset path.
    - Always call `lEvent.RefreshString()` after assigning a `LocalizedString` reference programmatically to update the UI immediately.
    - Keys must exist with a **non-empty value in every table** of a collection (en, de, ja, …). A key
      that exists with an empty value is the common gap, and it is not silent: the package prints its
      own "No translation found for …" text **into the game UI**, so the shipped screen shows a
      developer message. Do not eyeball this. Run the completeness check below.
- **Verification**: After modifying tables or addressables, run `AddressableAssetSettings.BuildPlayerContent()` and switch the Editor locale to verify changes. Check `LocalizationSettings.Instance` status after activation.
