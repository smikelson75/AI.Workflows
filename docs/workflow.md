# Workflow And Handoffs

This system is a staged workflow. Each stage owns a different kind of truth and hands a durable artifact to the next stage.

## The Normal Path

### 1. Discover or clarify

Use `/brain-storm` for a new idea or an unsettled product direction. It asks focused questions about the problem, users, desired outcome, workflow branches, scope, constraints, success, and vocabulary. When complete, it writes:

- `CONTEXT.md`: current product and domain truth.
- `UBIQUITOUS-LANGUAGE.md`: canonical terms and banned synonyms.

Do not proceed to the PRD while product decisions remain unresolved.

### 2. Onboard an existing repository

Use `/onboard-existing-project` when real code exists but the standard context, PRD, plan, or agent guidance is missing. It discovers repository evidence first, then hands a findings draft to the owning skills. It may sequence `brain-storm`, `prd-writer`, `work-planner`, and `agent-instructions`, but those skills remain responsible for their own artifacts.

If discovery contradicts the stated product purpose or behavior, surface the contradiction for resolution. Do not silently convert an inference into product truth.

### 3. Define the target

Use `/prd-writer` after context is current. The PRD describes the target state only:

- required behaviors grouped by capability or workflow;
- scope refinements and non-goals not already settled in context;
- target architecture direction and hard constraints;
- acceptance signals and planner-safe assumptions.

The default PRD path is `docs/prd/scheduler-prd.md`. The PRD must not contain progress, readiness, phases, slices, or implementation status.

### 4. Plan the gap

Use `/work-planner` after the context and PRD are settled. It compares repository reality with the PRD target and owns:

- current-state summaries;
- phase sequencing and dependencies;
- active slice detail;
- implementation status and plan drift.

The planner creates execution-ready slices. Every slice needs a user-visible outcome, file/module scope, verification command, and observable acceptance checks.

### 5. Execute a slice

Use `Orchestrator` to execute an approved plan. It reads only the main plan, active phase invariants, and next slice, then copies those contents into a `Coding Agent` brief. It does not implement product code, invent slices, or rewrite the plan.

`Coding Agent` implements the assigned slice within scope. It clarifies ambiguity, favors the smallest change, verifies behavior, and reports changed files, verification results, and risks.

For C# behavior changes, apply `/tdd-csharp` inside this implementation stage:

1. Red: add one failing test for one behavior.
2. Green: make the smallest production change that passes.
3. Refactor: improve the design while keeping tests green.
4. Repeat for the remaining behavior.
5. Finish with the full `dotnet test` suite.

### 6. Record and commit

After a successful slice, `Orchestrator` records status in the main plan. It stops after each slice unless asked to continue. Use `/conventional-commit` to inspect the diff, keep unrelated changes separate, and create a Conventional Commit for the coherent change.

## Handoff Gates

| Handoff | Required before proceeding |
| --- | --- |
| Discovery to context | Problem, users, workflow, scope, constraints, success, and vocabulary are answerable |
| Context to PRD | Context and glossary are current and confirmed |
| PRD to plan | Target behavior, constraints, and acceptance signals are settled |
| Plan to orchestrator | The next slice has outcome, scope, verification command, and acceptance checks |
| Orchestrator to coding agent | Slice and active phase invariants are copied verbatim |
| Slice completion | Verification passes and the result is reported |
| Commit | Staging scope is coherent and the message follows Conventional Commits 1.0.0 |

## Escalation Rules

- A changed problem, user, workflow, or vocabulary goes to `brain-storm`.
- A changed required behavior, scope boundary, hard constraint, or target architecture goes to `prd-writer`.
- A sequencing, dependency, status, or active-slice issue goes to `work-planner`.
- A slice that lacks a verification command stays blocked and returns to `work-planner`.
- A failed verification keeps the slice `in progress` until repaired and rerun.

These rules prevent implementation discoveries from quietly changing product intent or target state.

## Small Change Path

For a small, well-defined code change in a repository with current artifacts, skip discovery and product planning. Start with the owning implementation agent or skill, preserve the existing plan boundary, run focused verification, and update the plan only if the change belongs to an active slice. Use the full staged path when the change affects product behavior, architecture, or sequencing.