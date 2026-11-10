# Response contract

The full wording behind the rules in [../SKILL.md](../SKILL.md): the pre-work rules, the procedure, the
required output, and the final checks. The skill is usable from [../SKILL.md](../SKILL.md) alone; read this
file when you need the reasoning, the conditions in full, or the exact phrasing.

## Important

- Use the unity cli (`unity command --format json`) and the `unity-cli` and `unity-pipeline` skills for each step.
- Don't use `using` directives or unqualified types in the `snippet` for `eval`, because the compiler only reads `using UnityEngine`, and a bare `AssetDatabase` or `Object` causes errors (CS0246 / CS0103 / CS0104). `return` what you want to read; it arrives at `data.result.result`.
- Create a restore point you can roll back to if your changes fail.
- Do only what's asked. Don't change unrelated assets or files.
- Avoid long explanations.
- Never leave verification code in the user's script. Never build logging or detection they didn't ask for, because it clutters their project and console. Read state through `eval` instead, as described in [Final step](#final-step) below.

## Procedure

1. Before you call any tool, match the prompt against the [STOP CHECK](../SKILL.md#stop-check----match-before-any-tool-call) Fast-Paths. If one matches, write that answer and go to step 5.
2. Otherwise, get the Unity version from `ProjectSettings/ProjectVersion.txt`, and check which physics components the objects use (Rigidbody, Collider, `CharacterController`). If there's no project or no version, assume Unity 6000.3 and 3D PhysX, say so in your answer, and carry on. If the user gives no symptom, script, or scene to work on, ask for it.
3. Read the [documentation pages](topic-map.md) for the symptom.
4. Find the symptom in [Identify your symptom](symptom-index.md), read the reference it points to, and work through it within the Tool budget.
5. If you changed the project, run the [Final step](#final-step) checks. The Tool budget limits diagnosis, not these checks.
6. End with the answer described in [Required output](#required-output----non-negotiable) below. If you changed the project, use the Final report format in [final-report-example.md](final-report-example.md).

## Required output -- non-negotiable

Every invocation MUST end with a user-facing answer that gives the diagnosis and fix, because tool calls alone don't help the user.

**Hard stop**: After 5 tool calls of any kind, stop calling tools and write the most-likely diagnosis from the Fast-Paths or checklists, even if not fully confirmed.

**No permission-asking**: Never end with "Would you like me to proceed?" or similar. If the script is in the project or an Editor is connected, apply the fix directly by editing the script, or the scene through the Editor. Otherwise, give a complete self-contained explanation. Don't ask, because asking permission costs the user another turn.

## Tool budget


For cases not covered by the Fast-Paths: **at most 5 tool calls before committing to an answer**. Don't run C# in the Editor or fetch documentation to re-check rules this skill states, because they're already verified.

## Final step

Run these checks in order. If any check fails, reread the [docs pages](topic-map.md) to find out what you missed, fix it, and run the checks again.

1. Use `console_status` to check the project has zero console errors.
2. If the user didn't ask for proof and you don't suspect a fault, stop here.
3. Otherwise, enter Play mode once and reproduce the case. Read the outcome the user asked for through `eval`, such as whether the bullet's Rigidbody position stopped at the wall, not just the field you changed. Don't add logging or take screenshots, because they cost time and leave changes behind.
4. Exit Play mode and check again that the console has zero errors.

The Final report requirement, with a worked example, is in
[final-report-example.md](final-report-example.md).
