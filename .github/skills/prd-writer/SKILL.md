---
name: prd-writer
description: "Create or update a PRD from product context."
argument-hint: "Describe the product or change."
user-invocable: true
---

# PRD Writer

After `brain-storm`, turn settled domain context into a planner-ready PRD that describes the target state: what the product and repo should look like once v1 coding is done.

Defaults: read `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md` if present, derive `<artifact-slug>` from the settled project or product name in the ubiquitous language, and write `docs/prd/<artifact-slug>-prd.md`.

## Artifact Naming

- Derive `<artifact-slug>` from the canonical project, product, or system name in `UBIQUITOUS-LANGUAGE.md` when present.
- If the ubiquitous language does not settle a project name, derive `<artifact-slug>` from the product name in `CONTEXT.md`.
- Use lowercase kebab-case, keep the slug short and domain-specific, and preserve the same slug across PRD and plan artifacts.
- If neither source settles the name, ask for the project artifact slug before writing.
- PRD path: `docs/prd/<artifact-slug>-prd.md`.

## Contract

- The PRD describes target state only. It never records repo maturity, implemented/in-progress/absent areas, readiness, progress, or plan status; `work-planner` owns all of that.
- Treat `CONTEXT.md` as canonical. Reference it; do not restate problem, users, workflow, scope guardrails, or glossary entries already settled there.
- Add only what context lacks: required behaviors, target architecture direction, hard constraints, acceptance signals, and planner-safe assumptions.
- If context is missing or stale, stop and redirect to `brain-storm`.
- Write current truth only; remove superseded discussion, not an amendment log.
- Keep the PRD compact and bullet-first. Do not write plans, phases, slices, task lists, or story backlogs.
- Omit `Open decisions` when empty.

## Stability

The PRD is upstream of coding and should stay stable.

- Update it only when the target changes: new or changed required behavior, scope boundary, hard constraint, or target architecture direction.
- Do not update it for implementation discoveries, sequencing changes, status, or completed work. Those belong in plan artifacts.
- If a change would alter problem, users, workflow, or vocabulary, stop and redirect to `brain-storm` instead of editing the PRD.

## Read Order

1. `CONTEXT.md`
2. `UBIQUITOUS-LANGUAGE.md`, if present
3. existing `docs/prd/<artifact-slug>-prd.md`, if present

Do not survey the repo for maturity or progress, and do not read `docs/plans/`. Read code only to confirm a hard constraint the target must respect, such as an architecture direction or platform the user states is fixed.

## Workflow

1. Validate context and glossary against current intent. Any mismatch in language, workflow, or v1 scope blocks finalization; redirect to `brain-storm`.
2. Determine whether this is a new target or an amendment to the existing target.
3. Clarify until clear: required behaviors, scope refinements beyond the context guardrails, target architecture direction, hard constraints, acceptance signals, and planner-safe assumptions.
4. Resolve contradictions among user direction, context, glossary, and existing PRD before writing.
5. Write/update `docs/prd/<artifact-slug>-prd.md` using [references/PRD-FORMAT.md](references/PRD-FORMAT.md).

Ask one focused question at a time; use 2-4 only when coupled. Push vague answers, request real examples, and ask what `work-planner` would get wrong about the target.

## PRD Must Include

- A pointer to `CONTEXT.md` as the canonical domain artifact.
- Target outcome: what is true once v1 coding is done.
- Requirements as behaviors grouped by workflow/capability.
- Scope refinements and non-goals that context does not already state.
- Target architecture direction and hard constraints the finished repo must satisfy.
- Acceptance signals for the finished target.
- Planner-safe assumptions only.

Do not include repo maturity, implementation status, readiness assessments, phase plans, implementation tasks, user stories, or stale history. Include `Open decisions` only for unresolved blockers.

## Exit

Write only when context is current and the target state, constraints, and planner-safe assumptions are settled. Otherwise ask the next blocking question and do not write.

On completion, return a concise brief stating settled target decisions, planner-safe assumptions, and whether `work-planner` can proceed directly. The PRD is the durable artifact; the brief is disposable.
