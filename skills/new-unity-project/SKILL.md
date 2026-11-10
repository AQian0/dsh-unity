---
name: new-unity-project
description: Guides creating a new Unity project, from concept, platforms, and monetization to source control and packages. Use when the user asks to start a new game or prototype. Runs an opinionated paved path by default.
allowed-tools:
  - bash
  - write
  - edit
---

# New Unity Project

A flow from an idea to a running, version-controlled Unity project. This skill owns the **flow** — mode,
ordering, background installs, handoffs.

## Delegated skills — all shipped by this bundle

**Read these for the actual commands; don't reinvent them:** `unity-cli` (install, auth/license,
Editor install, creation, source control, open — the backbone), `unity-package-management`,
`urp-postprocessing` / `ui` / `2d-pixel-perfect` (Step 7), `craft-game-floors` (Step 6),
`implement-in-app-purchases` / `levelplay-unity-integration` / `build-live-game` (Step 9) — what each
one owns: [references/delegated-skills.md](references/delegated-skills.md).

Nothing is installed and no client plugin route is offered: load a step's skill with the `skill`
tool before the step. If one is missing from the catalog, say which and what it does, take that
step's fallback, and name the gap. Without `unity-package-management`, Step 5 can't run — say so
before Step 2. Preparation (the `com.unity.pipeline` package, the guide, the failure codes):
[references/skill-setup.md](references/skill-setup.md).

## Sandbox and approvals

DSH defaults to a `workspace-write` sandbox: a write outside the workspace or a network call can be
refused, and this flow needs both (the Editor install and Hub paths, `~/.unity` license state,
`unity auth login`'s browser, package resolution). When a command is refused, **stop and report
it**: name the command, what was blocked, the wider permission or approval it needs, then wait.
**Never route around a refusal** — no alternative command, no moving the work inside the workspace
to dodge the sandbox, no hand-writing what the blocked command would have produced.

## Mode: paved by default, guided on request

Run **paved** unless the user asks for the interview — in words ("ask me questions", "guide me")
or by pushing back on the manifest; mode is decided once per session. The paved contract:
**parse the prompt first** · **fill gaps from the Defaults table** · **print the manifest** before
the create launches · **proceed**, asking only on pushback or an unruled fork ·
**never consume a human gate** — sign-in, license activation and publishing each need the user's
yes, asked as a question you wait on (see Sign-in and license). A **bare/minimal** ask gets
`--bare`, skips the floors, and states the cost (identity, saves, ranks unwired). Bare runs Steps
1–4, installs only the packages the user named in Step 5, skips Steps 6 and 7, then commits (Step 8)
and hands off monetization (Step 9) without the forward baton.

In **guided** mode, ask only the current step's questions and wait; the paved additions (identity,
floors, baton) are asked at their steps, never assumed.

## Sign-in and license (before your first question)

Run `unity auth status --format json` and `unity license status --format json` first. If either
shows the user signed out or without an active license, ask **one** question covering both, with
`ask_user_question` (plain text only without it), and wait. Send it with the delegated-skills note
and any Step 1 question, so the user answers once. Offer the free **Unity Personal** license as the
default choice, with the other license types (an existing subscription, a serial, a floating
server) as alternatives; the Personal choice says it accepts the Unity Personal EULA
(https://unity.com/legal/editor-terms-of-service/software), so the user sees it first.

- Never tell the user to sign in or activate a license themselves, and never hand them commands to
  run. You run them, after they say yes.
- `unity auth login` where the choice needs an account — tell them the browser page is coming.
  `unity license activate --personal --accept-eula` for Personal; serial and floating need no
  account (`unity license activate --floating`, or `UNITY_LICENSE_SERIAL` with a bare
  `unity license activate`).
- Declining stops the run before the create only when nothing can license the Editor; with a serial
  or floating license, create with `--no-cloud` and say the cloud link and player accounts are off.

Question wording: [references/sign-in-and-license.md](references/sign-in-and-license.md).

## Defaults and the assumptions manifest

Every row of [the Defaults table](references/defaults.md) reverses on a word; change one only with a
run-earned receipt. Cloud link and diagnostics are **not** a row: create applies its own defaults.

Print exactly one block at the end of Step 2, before the create launches: it **predicts** what
create will do (the URP template per `--template 3d|2d`, never a guessed id), every assumption
present, each reversible, nothing implied; Step 3 reconciles the result against it. The exact
block is in [step 2](references/step-2-platforms-and-create.md#the-assumptions-manifest); its
handoff-note row is written only on the user's yes.

## The steps

The Editor install runs in the background over the user's answers, so setup feels instant — keep
talking while it runs. Read each step's reference before the step.

1. **Concept** — [step 1](references/step-1-concept.md): the paved 2–4 line brief (guided asks for
   it), before the template choice.
2. **Platforms & monetization** — [step 2](references/step-2-platforms-and-create.md): two decisions,
   then print the manifest, then start the create in the background.
3. **Join** — [step 3](references/step-3-join-and-reconcile.md) when the create returns: result
   fields, reconciliation, 403 retry, missing modules.
4. **Source control** — [step 4](references/step-4-source-control.md) before the repo is attached.
5. **Packages** — [step 5](references/step-5-packages.md); never hand-edit `manifest.json`.
6. **Identity, then the craft floors** — [step 6](references/step-6-identity-and-floors.md): never
   wire auth twice.
7. **Visual baseline** — [step 7](references/step-7-visual-baseline.md) before opening the Editor or
   any gameplay work; `--bare` skips it.
8. **Save & first commit** — [step 8](references/step-8-first-commit.md) with the Step 4 VCS, every
   `.meta` committed.
9. **Hand off** — [step 9](references/step-9-handoff.md): monetization skill, `AGENTS.md` baton,
   report.

## Scope — what this skill does NOT do

- **No gameplay scaffolding.** A running, wired project with a visual floor; the game is the next
  conversation (with `craft-game-floors`); the one exception is Step 6's single bootstrap script.
- **No command reference** — syntax lives in `unity-cli` / `unity-package-management`.
- **No re-deciding create's defaults** — narrate them from the result; the guided interview
  survives untouched.

## Checklist

Read [the checklist](references/checklist.md) before reporting, and do not report an item you have not checked.

## Common mistakes

Read [common mistakes](references/common-mistakes.md) when something looks done but is wrong: blocked creates, double-wired auth, pink shaders, committed `Library/`.
