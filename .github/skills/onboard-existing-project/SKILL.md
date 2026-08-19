---
name: onboard-existing-project
description: "Onboard an existing codebase with no CONTEXT.md, PRD, plan, or AGENTS.md by grounding brain-storm, prd-writer, and work-planner in real repo evidence."
argument-hint: "Describe the existing project or ask to onboard this repo"
user-invocable: true
---

# Onboard Existing Project

Bring an existing repository that has none of the standard artifacts (`CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, PRD, plan, `AGENTS.md`) up to a state where `brain-storm`, `prd-writer`, `work-planner`, and `agent-instructions` can operate normally. This skill does not replace those skills or write their artifacts itself; it sequences them and supplies the repo-grounded discovery step none of them own.

## When To Use

- The repo already has real code, but some or all of `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, the PRD, plan artifacts, and `AGENTS.md` are missing.
- Not for greenfield ideas with no code — send those straight to `brain-storm`.
- Not needed if the missing artifact is the only thing absent and the others are current; call that owning skill directly instead.

## Why Not Just Call The Three Skills

- `brain-storm` interviews from a vague idea; it does not read code, so an existing project's `CONTEXT.md` would be reconstructed from memory instead of the real behavior.
- `prd-writer` explicitly does not survey the repo for maturity; it trusts `CONTEXT.md` is already accurate.
- `work-planner` reads repo evidence, but only to find the gap to a PRD target it assumes is correct.

None of the three is responsible for the first pass of "what does this repo actually do and look like," so this skill supplies it before handing off.

## Workflow

1. Confirm scope: whole repo or a named subtree/product area.
2. Detect which artifacts already exist (`CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, PRD, main plan, `AGENTS.md`). Skip steps whose target artifact is already current; only backfill what is missing or stale.
3. Run read-only repo discovery per [references/DISCOVERY-CHECKLIST.md](references/DISCOVERY-CHECKLIST.md). Do not write anything in this step.
4. Turn discovery into a disposable findings draft: candidate problem/users/workflow, current architecture and stack, apparent conventions, glossary candidates. Flag contradictions and unknowns instead of guessing.
5. Hand off to `brain-storm` with the findings draft as pre-filled context. The interview should confirm or correct the draft and resolve only genuine ambiguities or contradictions, not re-ask what discovery already answered. Wait for `CONTEXT.md`/`UBIQUITOUS-LANGUAGE.md` to be written before continuing.
6. Hand off to `prd-writer`. For an existing project the target state is normally "current architecture as confirmed in step 5" plus any explicitly requested changes; ask the user what should change versus stay as-is before it writes the PRD.
7. Hand off to `work-planner`. Expect most existing behavior to land as already-implemented/foundation phases; the planner should size the real gap, not re-plan what already exists.
8. Optionally hand off to `agent-instructions` in bootstrap mode once context, PRD, and plan are current, so `AGENTS.md` reflects evidence-backed conventions.

## Boundaries

- Never write `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, the PRD, plan artifacts, or `AGENTS.md` directly — always delegate to the owning skill.
- Do not skip a downstream skill's own interview or validation because discovery produced a draft; the draft narrows questions, it does not replace confirmation.
- If discovery surfaces a contradiction (e.g., stated purpose vs. actual code behavior), surface it explicitly and let the user resolve it before `brain-storm` writes anything.
- If the repo is too large for full discovery, scope discovery to the confirmed subtree rather than sampling randomly.
- Re-running this skill after artifacts exist should be a no-op for the steps whose artifacts are already current.

## Exit

Return a brief listing: artifacts found vs. missing at the start, key discovery findings and any unresolved contradictions, which downstream skills ran, and which artifacts were created or updated. The written artifacts are durable; this brief is disposable.
