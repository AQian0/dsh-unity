---
name: validate-urp-render-graph-renderer-feature
description: Reviews a Unity 6 URP ScriptableRendererFeature that uses the Render Graph API, checking resource wiring, material binding, execution structure, and best practices. Use to validate a renderer feature.
---
# Skill: Validate a Unity URP Render Graph Renderer Feature

## Purpose
Review a Unity 6+ URP Render Graph `ScriptableRendererFeature` and its associated pass implementation for correctness issues related to material binding, resource wiring, render graph texture creation, static render function structure, global resource exposure, and API/version usage.

## When to Use
Use this skill when:
- reviewing AI-generated Unity URP Render Graph renderer feature code
- validating a custom `ScriptableRendererFeature` before integrating it
- checking for common Render Graph resource wiring and pass setup mistakes
- diagnosing suspicious but plausible Render Graph pass implementations
- reviewing whether a custom raster/blit/copy pass uses the most appropriate Render Graph helper APIs

## Inputs
The skill should expect:
- **Unity version**
- **URP version**
- **Render Graph renderer feature code to review**
  - `ScriptableRendererFeature`
  - associated pass code
  - or both
- **Intended behavior**
- **Expected inputs/outputs**, if known
- **Optional constraints**
  - project conventions
  - required pass type
  - known resources
  - required material/shader properties

## Output Format
The skill must return results in the following structure:

### 1. Validation Summary
A short overall assessment of the implementation.

### 2. Confirmed Issues
Concrete issues directly supported by the provided code.

### 3. Likely Issues / Risky Assumptions
Potential issues that depend on missing context or incomplete information.

### 4. Recommended Fixes
Minimal targeted fixes for each issue.

### 5. Corrected Snippets
Small corrected code snippets where useful.

### 6. Missing Information
Any information needed to validate the code with higher confidence.

## Validation Checklist

## Validation checklist

The eight checks — material binding, texture wiring, execution structure, descriptor validation, copy/blit simplification, global exposure, and input declaration: [references/validation-checklist.md](references/validation-checklist.md).
## Guardrails
The skill must:
- avoid inventing unsupported APIs
- distinguish **confirmed** issues from **likely** issues
- prefer minimal targeted fixes over broad rewrites
- explain why each issue matters
- flag hidden coupling and unnecessary global state
- state when the provided code is insufficient for full certainty

## Non-Goals
- guarantee runtime correctness
- rewrite the entire renderer feature unless necessary
- validate unrelated gameplay logic
- validate shader internals unless directly relevant to pass wiring or binding

## Evaluation Criteria
A successful validation should:
- catch real wiring and API issues
- identify suspicious but plausible mistakes
- provide actionable fixes
- avoid false certainty
- improve trust in generated render pass code

## Notes for Future Expansion
As new recurring issues are discovered, extend this checklist with additional rules such as:
- pass ordering / injection point validation
- resource lifetime and cleanup checks
- read/write hazard detection
- unnecessary copies or allocations
- camera depth/color dependency validation
- multi-pass dependency validation
- override material correctness
- pass configuration
