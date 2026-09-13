# Workflow And Handoffs

This system is a staged workflow. Each stage owns a different kind of truth and hands a durable artifact to the next stage.

## The Normal Path

### 1. Onboard a repository

Use `/onboard-project` first, unless the user already knows the repository is onboarded (context, PRD, plan, and `AGENTS.md` are current). It acts as a thin repository classifier and workflow router: it detects code maturity (empty, scaffold, mature), artifact presence, and detected stacks once, then sequences the owning skills using tailored, in-memory handoffs per [references/ONBOARDING-HANDOFF.md](../.github/skills/onboard-project/references/ONBOARDING-HANDOFF.md). It creates no durable onboarding TODO, checklist, or status artifact. Each domain skill or agent self-assesses its state, decides its own configuration and thresholds, writes its own artifacts, and reports a concise outcome.

The routing sequence it encodes:
- Resolves competing root instruction files first (`AGENT.md` vs `AGENTS.md` vs `.github/copilot-instructions.md`).
- For `empty` repositories: interview product context via `brain-storm`, settle stack and target architecture in `prd-writer`, plan Phase 0 scaffolding in `work-planner`, establish a clean Git baseline, execute scaffolding via `Orchestrator`, configure code-style and mutation-testing adapters once code exists, run `agent-instructions`, and route to `deterministic-verification`.
- For `scaffold` repositories: configure code style at blocking severity and mutation testing at measure-only before feature planning, then run `brain-storm` -> `prd-writer` -> `work-planner` -> `agent-instructions` -> `deterministic-verification`.
- For `mature` repositories: run code style at non-blocking severity and mutation testing to assess initial state, then run `brain-storm` -> `prd-writer` -> `work-planner`. `work-planner` receives the style and mutation findings, directly inspects existing E2E harness maturity, and sequences any required harness/remediation work into plan phases. QA starts asynchronously after active-phase planning. Finish with `agent-instructions` and `deterministic-verification`.

For an empty repository, create the initial Git baseline after context, PRD, and plan artifacts exist but before the first scaffolding slice is executed. Keep the slice files out of that baseline. This gives the Git-based integration gate a meaningful starting point and keeps the Engineer report scoped to the assigned slice. The primary agent or user owns this commit boundary; `Engineer` never creates it.

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

### 4.5 Design phase acceptance

After the active phase is planned, run `QA` or `/qa-design` to derive `docs/plans/phases/phase-XX/acceptance.feature` from product context, PRD acceptance signals, phase invariants, and slice outcomes. QA does not read application source code or implementation tests. It tags every scenario with a stable ID and exactly one test level: `@unit`, `@integration`, or `@e2e`.

QA drafting proceeds asynchronously with ordinary implementation slices. Human review may happen at any time before the final integration/E2E slice. `Orchestrator` records explicit approval in the main plan; it does not infer approval from file presence. Requirement gaps return to `prd-writer`, while phase boundary or test-environment gaps return to `work-planner`.

### 5. Execute a slice

Use `Orchestrator` to execute an approved plan, run as the active agent mode with both `agent` and `execute` tools — never dispatched through a subagent tool, which strips the tool parity it needs to dispatch `Engineer` and verify (see [docs/agents.md](agents.md)). It reads only the main plan, active phase invariants, and next slice, then copies those contents into an `Engineer` brief. It does not implement product code, invent slices, or rewrite the plan.

Orchestration operates on two tiers:
1. **Tier 1 (Autonomous Forward Progress)**: Routine deterministic cycles advance without human prompting. This includes inner TDD verification, dispatching Pass B when the gate returns `integrationRequired: true`, routing integration bugs back to Engineer A with failing test evidence, committing completed slices via `/conventional-commit`, and advancing to the next planned slice.
2. **Tier 2 (Structured Decision Menus)**: When human judgment is genuinely required (scope creep, uncommitted file collisions, missing requirements, QA review gate approval), the agent does not dump raw terminal output or ask vague questions. It presents a concise decision menu (under 30 lines) with a 1–2 sentence situation summary, 2–3 mutually exclusive options (clearly labeled as Agent Automated vs Human Action Required), and a policy-based recommendation.

`Engineer` implements the assigned slice within scope. It clarifies ambiguity, favors the smallest change, verifies behavior, and reports changed files, verification results, and risks.

Ordinary slices may proceed while QA review is pending. Before the final integration/E2E slice, `Orchestrator` requires the main plan's QA review gate to be `approved`. That slice implements all non-excepted `@e2e` scenarios and confirms that `@unit` and `@integration` scenario IDs map to executable tests. `Engineer` cannot edit Gherkin; proposed revisions return to `qa-design` and require renewed human approval.

For local deterministic integration gating, invoke `/deterministic-verification`. After Pass A, `Orchestrator` validates the structured report and runs the gate. The gate derives the changed-file set from Git, so an uncommitted slice is supported; a mismatch blocks completion until the user commits or isolates other work, supplies a known baseline, or intentionally reconciles a combined scope. A required Pass B is dispatched to the existing `Engineer` role with integration-only scope; it is not a separate agent. Phase-end E2E remains a separate final validation step.

For behavior changes, apply the shared TDD protocol ([`tdd/protocol.md`](../.github/skills/tdd/protocol.md) and [`tdd/test-design.md`](../.github/skills/tdd/test-design.md)) using the matching stack adapter (e.g. `/tdd-csharp` or `/tdd-typescript`) inside this implementation stage:

1. Red: add or update one focused test for one behavior or outcome partition, observe the expected failure, and record Red evidence.
2. Green: make the smallest production change that passes.
3. Refactor: improve design or readability while keeping tests green.
4. Repeat for the remaining behaviors.
5. Finish with the full project/package test suite.
6. Run static verification in addition to tests, never instead of tests.

A phase's **final integration slice** additionally applies `/stryker-dotnet` or `/stryker-js` (or another matching stack adapter) per [`mutation-testing/protocol.md`](../.github/skills/mutation-testing/protocol.md): an incremental mutation-testing run scoped to the phase's diff, unit tests only, measure-only until a backlog is cleared (mutation testing does not receive a dedicated slice; it is wired into this final verification command). Survivors inside the current slice's scope are fixed inline like any failed verification; survivors outside that scope, or a large batch, escalate to `work-planner` as remediation slices.

### 6. Record and commit

After a successful slice, `Orchestrator` records status in the main plan:
- In **interactive single-slice mode**: `Orchestrator` stops after the slice and prompts the user to review the diff and run `/conventional-commit`.
- In **autonomous multi-slice mode**: `Orchestrator` automatically invokes `/conventional-commit` to stage the verified slice changes and main plan status update, cleans up transient reports, creates a Conventional Commit, and advances immediately to the next planned slice until human intervention is required.

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
| Plan to QA | The active phase exposes its intended behavior, boundaries, slices, and test-environment constraints |
| Plan to orchestrator | The next slice has outcome, scope, verification command, and acceptance checks |
| QA to final E2E slice | `acceptance.feature` exists and human approval is recorded in the main plan |
| Orchestrator to engineer | Slice and active phase invariants are copied verbatim |
| Slice completion | Verification passes and the result is reported |
| Commit | Staging scope is coherent and the message follows Conventional Commits 1.0.0 |

## Escalation Rules

- A changed problem, user, workflow, or vocabulary goes to `brain-storm`.
- A changed required behavior, scope boundary, hard constraint, or target architecture goes to `prd-writer`.
- A sequencing, dependency, status, or active-slice issue goes to `work-planner`.
- A slice that lacks a verification command stays blocked and returns to `work-planner`.
- Missing or contradictory Gherkin inputs route to `prd-writer` for target behavior or `work-planner` for phase/test-environment detail.
- A requested change to approved Gherkin first returns to `Orchestrator` to invalidate approval, then to `qa-design` for revision and renewed review.
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
