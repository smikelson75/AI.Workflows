---
name: work-planner
description: "Create or update the implementation plan and active phase slices."
argument-hint: "Describe what changed or needs planning."
user-invocable: true
---

# Work Planner

After `brain-storm` and `prd-writer`, maintain the living implementation plan.

## Onboarding Input

When invoked from `onboard-project` with an in-memory [onboarding handoff](../onboard-project/references/ONBOARDING-HANDOFF.md), receive `onboarding_mode`, `repository_scope`, `workflow_artifacts`, and any style or mutation violation counts reported during onboarding.
1. Self-assess plan currency and phase readiness locally.
2. For mature codebases, perform targeted inspection of existing E2E harness maturity per the Evidence-Based E2E Readiness rules below.
3. Sequence necessary style backlog, mutation testing prerequisite/remediation, or E2E harness setup into phase slices.
4. Return a concise planning outcome; never write or update an onboarding status artifact.

When invoked directly without an onboarding envelope, detect existing artifacts and current repository reality using standard read order.

## Evidence-Based E2E Readiness

In mature codebases, `work-planner` directly assesses the existing E2E test harness rather than relying on arbitrary percentage thresholds or ungrounded assumptions:

| Evidence-Based E2E Condition | Planning Behavior |
| --- | --- |
| No discoverable E2E framework/configuration or runnable command | Add a harness/setup prerequisite slice before phase-final E2E automation. |
| Documented command executes, but one or more active-phase user journeys lack an existing executable test | Reuse the harness; scope the phase-final slice to implement missing approved scenarios. |
| Documented command executes and existing tests cover the active phase's user journeys | Preserve the suite; phase-final slice maps approved scenario IDs and adds only uncovered behavior discovered during mapping. |
| Command cannot execute in documented environment, or relevant tests have recorded quarantine/flaky/retry evidence | Add focused remediation slice before the affected journey becomes a phase gate. |

Record the command, observed result, and specific affected journey for every readiness conclusion. Legacy E2E debt does not automatically block unrelated phase work; scope blocking remediation strictly to journeys required by the active phase and sequence other verified gaps into future phases.

Defaults: read `.workflow/CONTEXT.md`, `.workflow/UBIQUITOUS-LANGUAGE.md` if present, `.workflow/prd/<artifact-slug>-prd.md`, the existing main plan and phase/slice artifacts; write the main plan and required phase/slice artifacts.

## Artifact Naming

- Derive `<artifact-slug>` from the canonical project, product, or system name in `.workflow/UBIQUITOUS-LANGUAGE.md` when present.
- If the ubiquitous language does not settle a project name, derive `<artifact-slug>` from the product name in `.workflow/CONTEXT.md`.
- Use lowercase kebab-case, keep the slug short and domain-specific, and preserve the same slug across PRD and plan artifacts.
- If neither source settles the name, ask for the project artifact slug before writing.
- PRD path: `.workflow/prd/<artifact-slug>-prd.md`.
- Main plan path: `.workflow/plans/<artifact-slug>-implementation-plan.md`.

## Consumer Contract

Plan artifacts exist to serve the `orchestrator` agent, which dispatches engineers governed by `.github/agents/engineer.agent.md`. The subagent never reads plan files; the orchestrator passes it a brief. Each artifact has one job:

- main plan: routing table. Which phase is active, which slice is next, what is done.
- phase detail: cross-slice invariants and boundaries that no single slice owns.
- slice detail: the self-contained payload the orchestrator turns into a subagent brief.
- phase acceptance feature: a `qa-design`-owned black-box contract drafted asynchronously after phase planning.

A slice must carry strong enough success criteria for a subagent to loop independently. If it cannot, it is under-specified, not under-sized.

## Contract

- Read order: context, glossary, PRD, main plan, phase/slice artifacts, targeted repo evidence.
- The PRD is the target state; this skill owns all current-state truth: repo maturity, architecture in place, implemented/in-progress/absent areas, readiness, and status.
- Plan the gap: sequence work from current repo reality toward the PRD target.
- If context or PRD is missing, stale, or contradictory, stop and ask for the prerequisite to be fixed.
- Never edit `.workflow/CONTEXT.md`, `.workflow/UBIQUITOUS-LANGUAGE.md`, or the PRD. Record implementation discoveries in plan artifacts; if a discovery changes the target, redirect to `prd-writer`, or to `brain-storm` when domain, users, workflow, or vocabulary change.
- Resolve conflicts among user direction, context, PRD, plan, repo evidence, and statuses before writing.
- Do not reopen product discovery settled in context or PRD; ask only what changes sequencing, dependencies, phase status, active slices, or planning assumptions.
- Inspect repo evidence only where it affects implementation status or sequencing.
- Follow [references/PLAN-FORMAT.md](references/PLAN-FORMAT.md), [references/PLAN-ARTIFACT-STRUCTURE.md](references/PLAN-ARTIFACT-STRUCTURE.md), and the main/phase/slice format references.

## ADR Gate

Before finalizing, check any newly settled sequencing or implementation-architecture decision against the three-part test: hard to reverse, surprising without context, and a real trade-off among genuine alternatives. If all three hold, hand off to `adr-writer` before returning. Otherwise skip silently. This is separate from target architecture direction, which `prd-writer` gates.

## Plan Rules

- Main plan: `.workflow/plans/<artifact-slug>-implementation-plan.md`; always the compact current-truth entry point.
- Every phase: retained `.workflow/plans/phases/phase-01/phase.md` style detail document.
- Slices: only under the single current `in progress` phase unless explicitly directed; use `slice-01-<slug>.md`.
- Use zero-padded numbering and relative links.
- Use only phase/slice statuses `planned`, `in progress`, `completed`; normally one phase is `in progress`.
- Record every status in the main plan only. Phase and slice documents carry no status field, so they stay effectively write-once and the orchestrator updates one file per transition.
- For the active phase, record a QA review gate in the main plan with state `pending` or `approved` and the expected `phases/phase-XX/acceptance.feature` path. Initialize it to `pending`; only `Orchestrator` records explicit human approval or invalidation.
- Keep roadmap at phase level; link to detail. Retain completed artifacts and update statuses rather than deleting/collapsing them.
- Never duplicate a field across artifacts. The main plan links to phase detail rather than restating it, and phase detail lists slice links rather than restating slice content.
- Size a slice as one vertical behavior. The final slice of every phase is an integration and/or end-to-end slice proving the phase's vertical behavior works as intended. Scope that slice to the phase's `acceptance.feature`: implement every non-excepted `@e2e` scenario (including approved positive workflows and adverse failure/safety scenarios) and verify that all `@unit` and `@integration` scenario IDs map to executable tests. Include caller-visible error assertions and state-preservation checks for rejected destructive operations where the PRD defines them. If approved scenarios cannot run independently due to harness deficiencies, include a focused harness-remediation item in the slice. Mutation testing does not get its own slice; when a mutation-testing adapter is supported for the detected stack, that final slice's verification command must automatically include the phase-scoped mutation-testing run (e.g. `dotnet stryker` or `npx stryker run`). If the root adapter config is missing, prompt or dispatch the matching adapter rather than silently dropping mutation testing. Route survivors and any required prerequisite test-writing phase per [`mutation-testing/protocol.md`](../mutation-testing/protocol.md).
- The planner may inspect repository evidence for harness readiness and implementation sequencing. It must not invent externally required failure behavior absent from context/PRD; route that gap to `prd-writer`.
- Design coherent phases around end-to-end value; keep future phase detail sufficient for later slices and active slices execution-ready.
- Do not use `Step`; use `Slice`. Do not add code-task lists, `Immediate start`, or execution checklists outside active slices.

## Workflow

1. Validate inputs and current intent.
2. Detect current state: project maturity, architecture direction in place, implemented/in-progress/absent areas, hard sequencing constraints, plan freshness, phase statuses, artifact drift, and configured/supported test and mutation adapters.
3. Derive the gap between current state and the PRD target, and record it in the main plan's current-state summary.
4. Clarify only ordering/dependency changes, current status, active-slice needs, and unsettled planner assumptions.
5. Write current-truth artifacts using the format references, omitting empty fields. Initialize the active phase's QA review gate to `pending`. For the final integration/E2E slice, include the acceptance-feature scope and traceability checks, and automatically include the phase-scoped mutation-testing verification command if the stack supports an adapter.
6. Apply the ADR Gate to any newly settled sequencing or implementation-architecture decision.

Write only when inputs, dependencies, statuses, active-slice needs, and artifact requirements are clear. Otherwise ask the next blocking question and do not write.

On completion, return a concise brief stating changed phase statuses, added/revised active slices, created/updated artifacts, and whether the plan is ready for execution. The artifacts are durable; the chat summary is disposable.
