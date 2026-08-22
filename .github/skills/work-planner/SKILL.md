---
name: work-planner
description: "Create or update the implementation plan and active phase slices."
argument-hint: "Describe what changed or needs planning."
user-invocable: true
---

# Work Planner

After `brain-storm` and `prd-writer`, maintain the living implementation plan.

Defaults: read `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md` if present, `docs/prd/<artifact-slug>-prd.md`, the existing main plan and phase/slice artifacts; write the main plan and required phase/slice artifacts.

## Artifact Naming

- Derive `<artifact-slug>` from the canonical project, product, or system name in `UBIQUITOUS-LANGUAGE.md` when present.
- If the ubiquitous language does not settle a project name, derive `<artifact-slug>` from the product name in `CONTEXT.md`.
- Use lowercase kebab-case, keep the slug short and domain-specific, and preserve the same slug across PRD and plan artifacts.
- If neither source settles the name, ask for the project artifact slug before writing.
- PRD path: `docs/prd/<artifact-slug>-prd.md`.
- Main plan path: `docs/plans/<artifact-slug>-implementation-plan.md`.

## Consumer Contract

Plan artifacts exist to serve the `orchestrator` agent, which dispatches coding subagents governed by `.github/agents/coding-agent.agent.md`. The subagent never reads plan files; the orchestrator passes it a brief. Each artifact has one job:

- main plan: routing table. Which phase is active, which slice is next, what is done.
- phase detail: cross-slice invariants and boundaries that no single slice owns.
- slice detail: the self-contained payload the orchestrator turns into a subagent brief.

A slice must carry strong enough success criteria for a subagent to loop independently. If it cannot, it is under-specified, not under-sized.

## Contract

- Read order: context, glossary, PRD, main plan, phase/slice artifacts, targeted repo evidence.
- The PRD is the target state; this skill owns all current-state truth: repo maturity, architecture in place, implemented/in-progress/absent areas, readiness, and status.
- Plan the gap: sequence work from current repo reality toward the PRD target.
- If context or PRD is missing, stale, or contradictory, stop and ask for the prerequisite to be fixed.
- Never edit `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, or the PRD. Record implementation discoveries in plan artifacts; if a discovery changes the target, redirect to `prd-writer`, or to `brain-storm` when domain, users, workflow, or vocabulary change.
- Resolve conflicts among user direction, context, PRD, plan, repo evidence, and statuses before writing.
- Do not reopen product discovery settled in context or PRD; ask only what changes sequencing, dependencies, phase status, active slices, or planning assumptions.
- Inspect repo evidence only where it affects implementation status or sequencing.
- Follow [references/PLAN-FORMAT.md](references/PLAN-FORMAT.md), [references/PLAN-ARTIFACT-STRUCTURE.md](references/PLAN-ARTIFACT-STRUCTURE.md), and the main/phase/slice format references.

## ADR Gate

Before finalizing, check any newly settled sequencing or implementation-architecture decision against the three-part test: hard to reverse, surprising without context, and a real trade-off among genuine alternatives. If all three hold, hand off to `adr-writer` before returning. Otherwise skip silently. This is separate from target architecture direction, which `prd-writer` gates.

## Plan Rules

- Main plan: `docs/plans/<artifact-slug>-implementation-plan.md`; always the compact current-truth entry point.
- Every phase: retained `docs/plans/phases/phase-01/phase.md` style detail document.
- Slices: only under the single current `in progress` phase unless explicitly directed; use `slice-01-<slug>.md`.
- Use zero-padded numbering and relative links.
- Use only phase/slice statuses `planned`, `in progress`, `completed`; normally one phase is `in progress`.
- Record every status in the main plan only. Phase and slice documents carry no status field, so they stay effectively write-once and the orchestrator updates one file per transition.
- Keep roadmap at phase level; link to detail. Retain completed artifacts and update statuses rather than deleting/collapsing them.
- Never duplicate a field across artifacts. The main plan links to phase detail rather than restating it, and phase detail lists slice links rather than restating slice content.
- Size a slice as one vertical behavior. The final slice of every phase is an integration and/or end-to-end slice proving the phase's vertical behavior works as intended.
- Design coherent phases around end-to-end value; keep future phase detail sufficient for later slices and active slices execution-ready.
- Do not use `Step`; use `Slice`. Do not add code-task lists, `Immediate start`, or execution checklists outside active slices.

## Workflow

1. Validate inputs and current intent.
2. Detect current state: project maturity, architecture direction in place, implemented/in-progress/absent areas, hard sequencing constraints, plan freshness, phase statuses, and artifact drift.
3. Derive the gap between current state and the PRD target, and record it in the main plan's current-state summary.
4. Clarify only ordering/dependency changes, current status, active-slice needs, and unsettled planner assumptions.
5. Write current-truth artifacts using the format references, omitting empty fields.
6. Apply the ADR Gate to any newly settled sequencing or implementation-architecture decision.

Write only when inputs, dependencies, statuses, active-slice needs, and artifact requirements are clear. Otherwise ask the next blocking question and do not write.

On completion, return a concise brief stating changed phase statuses, added/revised active slices, created/updated artifacts, and whether the plan is ready for execution. The artifacts are durable; the chat summary is disposable.
