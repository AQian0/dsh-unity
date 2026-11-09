# CI: activate a license, then build

```bash
# 1. Activate a license without signing in; a service account cannot activate one.
#    A perpetual or legacy serial: store it as the CI secret UNITY_LICENSE_SERIAL
#    (the name `unity ci init` generates) and pass it to the step, e.g. in GitHub
#    Actions `env: { UNITY_LICENSE_SERIAL: ${{ secrets.UNITY_LICENSE_SERIAL }} }`.
#    A serial tied to a subscription needs a signed-in user, so for those seats use
#    --floating, or the offline --generate-request / --file path (see "Headless /
#    fleet license activation" in references/auth-license-cloud.md).
unity license activate   # reads UNITY_LICENSE_SERIAL from the step env, so the serial stays off argv; or: unity license activate --floating

# 2. Only if the job also runs cloud commands: export UNITY_SERVICE_ACCOUNT_ID and
#    UNITY_SERVICE_ACCOUNT_SECRET from the CI secret store. Every later command reads
#    them directly, with no `unity auth login` and nothing written to a credential
#    store (which a headless runner may not have).

# 3. Build
unity build /path/to/MyProject \
  --editor-version 6000.0.47f1 \
  --target StandaloneLinux64 \
  --execute-method Builder.PerformBuild \
  --allow-install
echo "Exit code: $?"

# 4. Return the license when done (serial or assigned seats)
unity license return --yes
```

# CI: headless build

Prefer the dedicated `unity build` command (handles batch mode, logging, and CI flags):

```bash
unity build /path/to/MyProject \
  --editor-version 6000.0.47f1 \
  --target StandaloneLinux64 \
  --execute-method Builder.PerformBuild \
  --allow-install
echo "Exit code: $?"
```

Or use `unity run` (batch mode is automatic — never pass `-batchmode`/`-quit`):

```bash
unity run /path/to/MyProject \
  --editor-version 6000.0.47f1 \
  --allow-install \
  -- -executeMethod Builder.PerformBuild -logFile build.log
echo "Exit code: $?"
```

Writing scripts for a player build? Keep each `MonoBehaviour` alone in a `.cs` file named after its class. Several in one file can run fine in the Editor and Play Mode, yet the built player crashes at startup saying a scene file such as `level0` is corrupted. See [build-run-test.md](build-run-test.md#build).

# CI: run tests and publish results

```bash
unity test /path/to/MyProject \
  --editor-version 6000.0.47f1 \
  --mode EditMode \
  --report-format junit \
  --output ./test-results.xml \
  --allow-install \
  --timeout 600
case $? in
  0) echo "All tests passed" ;;
  8) echo "Tests failed — report to developers, do not retry" ;;
  *) echo "Run did not complete — infrastructure failure, safe to retry" ;;
esac
```

Exit `8` means the run finished and reported failing tests; any other non-zero code means it never produced a verdict. Under `--format json` the same split is `errors[0].code`: `TESTS_FAILED` versus `TEST_RUN_ERROR` / `TEST_TIMED_OUT`.

`--report-format junit` makes `--output` a JUnit-schema report, which GitHub Actions and GitLab ingest as native test results with no converter step. It is written even when tests fail. Drop the flag for the NUnit3 default, or use `--report-format nunit,junit` to get both from one run. Add `--coverage` to collect coverage via the Unity Code Coverage package — it warns and carries on if the project doesn't have the package. See [build-run-test.md](build-run-test.md).

**Iterating on a change, not gating a pipeline?** Run the cheapest test that can fail for the change. Try EditMode first. Use `--filter`, `--affected` or `--rerun-failed` while you work. Run the full suite on the final code, once per mode, before you hand the work back. Never re-run a suite on code that has not changed, unless the run exited `6` with no verdict. Keep the NUnit default for these runs, because `--affected` and `--rerun-failed` cannot read the JUnit-only report the CI example above writes. [build-run-test.md](build-run-test.md#run-the-cheapest-test-that-proves-the-change) has the rule, and which report each flag reads and writes. `unity test` refuses a project that is open in an Editor: don't close the user's Editor to make room, and don't start a test run while they are in Play Mode.
