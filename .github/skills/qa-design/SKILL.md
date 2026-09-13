---
name: qa-design
description: "Design or revise phase acceptance scenarios in Gherkin for human review before phase-end test automation."
argument-hint: "Name the active phase whose acceptance scenarios need drafting or revision."
user-invocable: true
---

# QA Design

Create a black-box acceptance contract from settled requirements and plans while implementation proceeds independently.

## Onboarding Input

When invoked following `work-planner` after active phase creation:
- Derive scenarios solely from settled target requirements (`docs/prd/`) and active phase scope (`phase.md`).
- Never inspect, execute, or reverse-engineer existing unit, integration, or E2E tests, and never read implementation code.
- Draft asynchronously in the primary conversation; human review may remain pending when onboarding completes its routing brief. The phase-final integration/E2E slice remains blocked until the gate records explicit human approval.
- Return a concise scenario brief; never write or update an onboarding status artifact.

When invoked directly without an onboarding envelope, follow the standard read order below.

## Inputs And Read Order

1. `CONTEXT.md` and `UBIQUITOUS-LANGUAGE.md` for user intent and canonical terms.
2. `docs/prd/<artifact-slug>-prd.md` for required behavior and acceptance signals.
3. The main plan for the active phase and its QA review state.
4. The active `phase.md` and all of its slice documents for phase boundaries, outcomes, and test checkpoints.
5. [`references/GHERKIN-FORMAT.md`](references/GHERKIN-FORMAT.md) for the output contract.

Do not read application source code, implementation tests, generated output, or Engineer reports. If a required environment constraint is absent from the phase plan, route the gap to `work-planner` instead of inferring it from code.

## Ownership

- `qa-design` owns `docs/plans/phases/phase-XX/acceptance.feature`.
- `work-planner` creates the phase's QA review gate in the main plan.
- `Orchestrator` records explicit human approval or invalidation in that gate and blocks only the final integration/E2E slice while approval is absent.
- `Engineer` implements and executes tests. It does not edit the approved Gherkin contract.

## Workflow

1. Confirm the phase plan is stable enough to expose its intended user-visible behavior and that the main plan's QA review state is `pending`.
2. Trace every PRD and phase acceptance signal relevant to the phase into one or more observable scenarios.
3. Assign each scenario one unique scenario ID and exactly one verification-level tag: `@unit`, `@integration`, or `@e2e`.
4. Give each scenario one triggering action and one primary behavior so failures identify the broken contract. Split scenarios when later actions depend on earlier assertions or when one failure could prevent another behavior from being evaluated.
5. Apply a systematic outcome-partition pass for each applicable requirement:
   - consider success, invalid request, unmet precondition, safety rejection, dependency/environment failure, state preservation after rejection, and continued service usability;
   - select only materially distinct observable contracts;
   - assign the cheapest test level (`@unit`, `@integration`, `@e2e`) that proves each contract;
   - use `@e2e` when public protocol error shape, process lifecycle, transport framing, or final external state is material;
   - do not use one broad scenario as a substitute for independently meaningful failures;
   - do not inspect source code or tests, and do not attempt to cover internal implementation branches.
6. Use `@e2e` for independently valuable journeys through the assembled public interface. Do not bundle unrelated behaviors merely to reduce E2E count; retain a multi-action journey only when the complete sequence is itself a required user workflow, and do not use it as a substitute for focused scenarios needed for behavioral clarity.
7. Write or revise `acceptance.feature` using the format reference.
8. Report requirement gaps separately. A missing or contradictory required behavior blocks approval and routes to `prd-writer`; a phase boundary, sequencing, or test-environment gap routes to `work-planner`.
9. Ask the human to review the Gherkin. Do not record approval yourself; after approval, direct the user to `Orchestrator` to record it in the main plan.

Drafting runs asynchronously with ordinary implementation slices. The final integration/E2E slice remains blocked until the main plan records QA review as `approved`.

## Revision Rules

- Refuse to revise a feature while its main-plan QA review state is `approved`. Ask `Orchestrator` to invalidate approval first.
- Any behavior-affecting revision requires renewed human approval.
- Do not turn an implementation limitation into a changed requirement. Route target changes to `prd-writer`.
- A scenario may use `@exception` only when the feature records a specific reason and the human approves that exception. `@exception` replaces executable-test traceability; it does not waive the behavior itself.

## Exit Conditions

Finish when the phase feature:

- accounts for every applicable acceptance signal;
- uses canonical domain language and observable behavior;
- keeps each scenario independently diagnosable around one primary behavior;
- gives every scenario a unique ID and one verification-level tag;
- contains no unresolved requirement ambiguity;
- is ready for human review.

Return the feature path, scenario count by verification level, unresolved blockers, and the exact next approval action. Do not report implementation advice.