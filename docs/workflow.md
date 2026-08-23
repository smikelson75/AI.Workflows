# Workflow And Handoffs

This system is a staged workflow. Each stage owns a different kind of truth and hands a durable artifact to the next stage.

## The Normal Path

### 1. Onboard a repository

Use `/onboard-project` first, unless the user already knows the repository is onboarded (context, PRD, plan, and `AGENTS.md` are current). It detects code maturity (empty, scaffold, mature), artifact maturity, and stack, then sequences the owning skills for that state, calling `brain-storm` itself as its first owned step. For existing code it discovers repository evidence first and hands a findings draft downstream. It may sequence `brain-storm`, `prd-writer`, `work-planner`, the matching code style adapter, the matching mutation-testing adapter, and `agent-instructions`, but those skills remain responsible for their own artifacts.

The routing it encodes so the user does not have to remember it: resolve competing instruction files first; an empty repo settles the stack in `prd-writer` before any style config can run; a scaffold takes style config immediately at blocking severity; a mature codebase takes it non-blocking and turns the violation count into plan phases; `agent-instructions` always runs last and once.

If discovery contradicts the stated product purpose or behavior, surface the contradiction for resolution. Do not silently convert an inference into product truth.

### 2. Discover or clarify

If the repository is already known to be onboarded, start here directly with `/brain-storm` for a new idea or an unsettled product direction. It asks focused questions about the problem, users, desired outcome, workflow branches, scope, constraints, success, and vocabulary. When complete, it writes:

- `CONTEXT.md`: current product and domain truth.
- `UBIQUITOUS-LANGUAGE.md`: canonical terms and banned synonyms.

Do not proceed to the PRD while product decisions remain unresolved.

### 3. Define the target

Use `/prd-writer` after context is current. The PRD describes the target state only:

- required behaviors grouped by capability or workflow;
- scope refinements and non-goals not already settled in context;
- target architecture direction and hard constraints;
- acceptance signals and planner-safe assumptions.

The default PRD path is `docs/prd/<artifact-slug>-prd.md`, where `<artifact-slug>` comes from the settled project or product name in `UBIQUITOUS-LANGUAGE.md` and falls back to `CONTEXT.md` only when needed. The PRD must not contain progress, readiness, phases, slices, or implementation status.

Before finalizing, `prd-writer` checks any newly settled target architecture direction or hard constraint against the ADR test (hard to reverse, surprising without context, real trade-off among genuine alternatives) and hands off to `adr-writer` when it holds.

### 4. Plan the gap

Use `/work-planner` after the context and PRD are settled. It compares repository reality with the PRD target and owns:

- current-state summaries;
- phase sequencing and dependencies;
- active slice detail;
- implementation status and plan drift.

The planner creates execution-ready slices. Every slice needs a user-visible outcome, file/module scope, verification command, and observable acceptance checks.

Before finalizing, `work-planner` applies the same ADR test to any newly settled sequencing or implementation-architecture decision and hands off to `adr-writer` when it holds.

### 5. Execute a slice

Use `Orchestrator` to execute an approved plan. It reads only the main plan, active phase invariants, and next slice, then copies those contents into an `Engineer` brief. It does not implement product code, invent slices, or rewrite the plan.

`Engineer` implements the assigned slice within scope. It clarifies ambiguity, favors the smallest change, verifies behavior, and reports changed files, verification results, and risks.

For local deterministic integration gating, invoke `/deterministic-verification`. After Pass A, `Orchestrator` validates the structured report and runs the gate. The gate derives the changed-file set from Git, so an uncommitted slice is supported; a mismatch blocks completion until the user commits or isolates other work, supplies a known baseline, or intentionally reconciles a combined scope. A required Pass B is dispatched to the existing `Engineer` role with integration-only scope; it is not a separate agent. Phase-end E2E remains a separate final validation step.

For C# behavior changes, apply `/tdd-csharp` inside this implementation stage:

1. Red: add one failing test for one behavior.
2. Green: make the smallest production change that passes.
3. Refactor: improve the design while keeping tests green.
4. Repeat for the remaining behavior.
5. Finish with the full `dotnet test` suite.

A phase's **final integration slice** additionally applies `/stryker-dotnet` (or the matching stack adapter) per [`mutation-testing/protocol.md`](../.github/skills/mutation-testing/protocol.md): an incremental mutation-testing run scoped to the phase's diff, unit tests only, measure-only until a backlog is cleared. Survivors inside the current slice's scope are fixed inline like any failed verification; survivors outside that scope, or a large batch, escalate to `work-planner` as remediation slices.

### 6. Record and commit

After a successful slice, `Orchestrator` records status in the main plan. It stops after each slice unless asked to continue. Use `/conventional-commit` to inspect the diff, keep unrelated changes separate, and create a Conventional Commit for the coherent change.

## Resuming After Context Loss

If a session ends mid-work (cleared context, new chat, restart), reconstruct state in this order, cheapest first:

1. `git status` and `git diff` — free, ground-truth answer for any uncommitted change in progress. Check this before asking anything.
2. Ask `Orchestrator` to continue (e.g. "run the next slice"). It reads only the main plan, active phase invariants, and next slice file — the minimum payload needed to resume, and the only path that knows the plan's status field is authoritative.
3. Only if no plan exists yet, ask the general chat agent to look around. It has no contract pointing it at `docs/plans/`, so it will search broadly (files, git log, code) to guess at state. This is the most expensive and least reliable option, and should be a last resort, not a habit.

Do not write a separate "session status" artifact to make step 3 cheaper: it would add a durable-write cost to every slice to save tokens on an infrequent event, and a written note can drift from the code while `git diff` cannot.

## Handoff Gates

| Handoff | Required before proceeding |
| --- | --- |
| Discovery to context | Problem, users, workflow, scope, constraints, success, and vocabulary are answerable |
| Context to PRD | Context and glossary are current and confirmed |
| PRD to plan | Target behavior, constraints, and acceptance signals are settled |
| Plan to orchestrator | The next slice has outcome, scope, verification command, and acceptance checks |
| Orchestrator to engineer | Slice and active phase invariants are copied verbatim |
| Slice completion | Verification passes and the result is reported |
| Commit | Staging scope is coherent and the message follows Conventional Commits 1.0.0 |

## Escalation Rules

- A changed problem, user, workflow, or vocabulary goes to `brain-storm`.
- A changed required behavior, scope boundary, hard constraint, or target architecture goes to `prd-writer`.
- A sequencing, dependency, status, or active-slice issue goes to `work-planner`.
- A slice that lacks a verification command stays blocked and returns to `work-planner`.
- A failed verification keeps the slice `in progress` until repaired and rerun.
- A hard-to-reverse, surprising, real-trade-off technical decision goes to `adr-writer`; a routine or reversible one does not.

These rules prevent implementation discoveries from quietly changing product intent or target state.

## Small Change Path

Every skill is independently invocable. Match the change to the skill that owns the kind of truth it touches; do not run earlier stages just because a later one is needed. Size of the diff is not the trigger — kind of truth is.

| Change | Route |
| --- | --- |
| Typo, isolated bug fix, or refactor with no behavior/scope/architecture change | Implement directly (or via `Engineer` with an ad hoc brief), verify, then `/conventional-commit`. No context, PRD, or plan edit needed. |
| Bug fix that changes observable behavior but not scope, constraints, or architecture | Same as above. Touch the plan only if the fix belongs to an active slice; update that slice's status in the main plan. |
| Change to a required behavior, scope boundary, hard constraint, or target architecture, however small | `/prd-writer` alone, then `/work-planner` only if sequencing or dependencies shift. Skip `brain-storm` if the problem, users, workflow, and vocabulary are unchanged. |
| Change to the problem, users, workflow, or vocabulary | `/brain-storm` alone. |
| New idea, or product direction that is still unsettled | Full path: `brain-storm` -> `prd-writer` -> `work-planner` -> `Orchestrator`. |

Mid-session realizations follow the same rule: if you discover a needed change while coding, stop and invoke only the skill that owns that kind of truth, then resume. You do not need to restart the whole workflow from `brain-storm`.
