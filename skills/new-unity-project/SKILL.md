---
name: new-unity-project
description: Guides creating a new Unity project, from concept, platforms, and monetization to source control and packages. Use when the user asks to start a new game or prototype. Runs an opinionated paved path by default.
allowed-tools:
  - Bash
  - Write
  - Edit
---

# New Unity Project

A flow from an idea to a running, version-controlled Unity project. This skill owns the **flow** —
mode, defaults, ordering, background installs, handoffs.

**Delegates to (read these for the actual commands — don't reinvent them):**
- **`unity-cli`** — install, auth/license, Editor install, creation, source control, open. Its
  "Bootstrap a new project from scratch" workflow is the backbone here.
- **`unity-package-management`** — packages with the Pipeline `package` commands (C# script fallback).
- **`urp-postprocessing`**, **`ui`**, **`2d-pixel-perfect`** — visual-baseline mechanics (Step 7).
- **`craft-game-floors`** — the craft floors (look, feel, audio, shell, live floor, the done gate),
  loaded at Step 6 and carried through the build.
- **`implement-in-app-purchases`**, **`levelplay-unity-integration`**, **`build-live-game`** —
  monetization / backend *integration* (invoked at the end).

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

In **guided** mode, ask only the current step's questions and wait. The paved additions (identity,
floors, baton) are asked at their steps there, never assumed.

## Sign-in and license (before your first question)

Run `unity auth status --format json` and `unity license status --format json` first. If either
shows the user signed out or without an active license, ask **one** question that covers both,
with your client's multiple-choice question tool (plain text only without one), and wait for the
answer. Send it together with the delegated-skills offer (below) and any Step 1 question, so the
user answers once. Offer the free
**Unity Personal** license as the default choice, with the other license types (a subscription the
account already has, a serial, a floating server) as alternatives. The Personal choice itself says
that picking it accepts the Unity Personal EULA
(https://unity.com/legal/editor-terms-of-service/software), so the user sees it before answering.

- Never tell the user to sign in or activate a license themselves, and never hand them commands to
  run. You run them, after they say yes.
- On yes, sign in only where the choice needs an account: Personal and an existing subscription
  activate the signed-in user's licenses, and a cloud-linked project needs one too. Run
  `unity auth login` then (it opens the browser; the user only completes the sign-in page, so tell
  them that page is coming), in the background or with its output unfiltered, and pass on the
  sign-in link it prints in case the browser doesn't open: a pipe through `tail` holds the link
  back until sign-in ends. Then `unity license activate --personal --accept-eula` for Personal.
  Serial and floating activation need no account: `unity license activate --floating`, or the
  serial through `UNITY_LICENSE_SERIAL` and a bare `unity license activate`, so it stays off argv.
- Declining stops the run before the create only when nothing can license the Editor. A user who
  declines sign-in but has, or activates, a serial or floating license still gets a local project:
  create with `--no-cloud` and say the cloud link and player accounts are off.

## The Defaults table

Every row reverses on a word; change a row only with a run-earned receipt.

| Decision | Paved opinion |
|---|---|
| Editor version | `--editor-version latest`, explicit |
| Template | URP; 3D unless the prompt says 2D (`--template 3d` or `2d`) |
| Platforms | Desktop only; add modules when the prompt implies them ("mobile game" → ios/android) |
| Monetization | None at creation; noted for later |
| Version control | Local git + Unity .gitignore |
| Player identity | Anonymous accounts — create's when its result shows them, else wired in Step 6 |
| Craft floors | Always on, via the `craft-game-floors` skill: look, camera, lighting, feedback, audio, shell, live floor, done gate |

Cloud link and diagnostics are **not** a row: create applies its own defaults — narrate them from
the result, don't re-decide.

## The assumptions manifest

Print exactly one block at the end of Step 2, before the create launches. It **predicts** what
create will do (the URP template per `--template 3d|2d`, never a guessed id):

> **Paved assumptions:** Unity <editor> · <URP template, 2D/3D> · <platforms> · <monetization> ·
> anonymous player accounts (create's, else one bootstrap script) · <version control> ·
> cloud-linked with diagnostics (create's defaults, narrated from the result) · floor packages
> (Cinemachine; identity + live services when cloud-linked) · craft floors on via `craft-game-floors` ·
> a one-line handoff note for the project's CLAUDE.md, written only on your yes.
> Say the word to change any of these; otherwise I'm proceeding.

One block, every assumption present, each reversible, nothing implied; Step 3 reconciles the
result against it.

## Before Step 1: check the delegated skills are loaded

Look for `unity-cli`, `unity-package-management`, `urp-postprocessing`, `ui`, `build-live-game`
and `craft-game-floors` in your client's skills. If any is missing, say which and what it does, and offer the install routes
in [references/skill-setup.md](references/skill-setup.md), in the same question as sign-in and
license when that one goes out — never install without a yes. Don't
stall: a decline gets the fallback at its step, gap named in the report. `unity skill show` prints
`unity-cli` without installing; without `unity-package-management`, Step 5 can't run — say so
before Step 2.

## The flow — and where the parallelism is

1. **Concept** (paved: parsed from the prompt). 2. **Platforms & monetization** — print the
manifest (paved), then **start the create in the background**: `projects create --install-editor`
installs the Editor + modules (minutes), then creates the project; keep talking meanwhile.
3. **(joins)** reconcile the result against the manifest. 4. **Source control.** 5. **Packages.**
6. **Player identity, then the craft floors** — confirm create's identity or wire it; load
`craft-game-floors`. 7. **Visual baseline** on the craft skill's art bible. 8. **Save & first commit.**
9. **Hand off** + the forward baton.

The multi-minute Editor install overlaps the user's answers, so setup feels instant.

## Step 1 — Concept

Paved runs parse the prompt into a 2–4 line brief; guided runs ask for it. Read [step 1 — concept](references/step-1-concept.md) before the template choice or any guided question: it lists the brief's fields and what the brief later drives.

## Step 2 — Platforms & monetization, then start installing

Two decisions, then the manifest prints, then the create starts in the background. Read [step 2 — platforms, monetization, and the create](references/step-2-platforms-and-create.md) before you launch a project: it has the exact `unity projects create` flags, the template rules, and the module mapping.

## Step 3 — Join: project ready, result reconciled

Read [step 3 — join and reconcile](references/step-3-join-and-reconcile.md) when the background create returns: it names the result fields, the manifest reconciliation, the cloud-link 403 retry, and the missing-module follow-up.

## Step 4 — Source control

Read [step 4 — source control](references/step-4-source-control.md) before attaching a repo: it holds the `link vcs` flags, why `--no-initial-commit`, and the Unity Version Control option.

## Step 5 — Packages

Never hand-edit `manifest.json`. Read [step 5 — packages](references/step-5-packages.md) before installing: it has the paved package set, the bare-run exception, and the render-pipeline warning.

## Step 6 — Player identity, then the craft floors

Read [step 6 — player identity and the craft floors](references/step-6-identity-and-floors.md) once packages land: it decides identity from the create result, never wires auth twice, and says when to load `craft-game-floors`.

## Step 7 — Visual baseline

Read [step 7 — visual baseline](references/step-7-visual-baseline.md) before opening the Editor and before any gameplay work: it carries the Pipeline-install-before-open order, the 6000.5.0–6000.5.2 blocker, and all six baseline items with their URP/Built-in caveats. A `--bare` run skips it.

## Step 8 — Save & first commit

Read [step 8 — save and first commit](references/step-8-first-commit.md) to commit with the VCS from Step 4: it has the git sequence, the `.meta` requirement, and the mirrored-skills question.

## Step 9 — Hand off

Read [step 9 — hand off](references/step-9-handoff.md) at the end: it routes monetization to the matching integration skill, gives the forward-baton wording, and lists what the report must contain.

## Scope — what this skill does NOT do

- **No gameplay scaffolding.** A running, wired project with a visual floor; the game is the next
  conversation (with `craft-game-floors`). One exception: Step 6's single bootstrap script.
- **No command reference.** Syntax lives in `unity-cli` / `unity-package-management`.
- **No re-deciding create's defaults** — narrate them from the result. The Defaults table is this
  file's only opinions; the guided interview survives untouched.

## Checklist

Read [the checklist](references/checklist.md) before reporting, and do not report an item you have not checked.

## Common mistakes

Read [common mistakes](references/common-mistakes.md) when something looks done but is wrong — blocked creates, double-wired auth, pink shaders, committed `Library/`.

