# Workflow And Handoffs

This system is a staged workflow. Each stage owns a different kind of truth and hands a durable artifact to the next stage.

## The Normal Path

### 1. Onboard a repository

Use `/onboard-project` first, unless the user already knows the repository is onboarded (context, PRD, plan, and `AGENTS.md` are current). It detects code maturity (empty, scaffold, mature), artifact maturity, test-suite maturity, and stack, then sequences the owning skills for that state, calling `brain-storm` itself as its first owned step. For existing code it discovers repository evidence first and hands a findings draft downstream. It may sequence `brain-storm`, `prd-writer`, `work-planner`, the matching code style adapter, and `agent-instructions`, but those skills remain responsible for their own artifacts. It offers `/mutation-testing` rather than enabling it.

The routing it encodes so the user does not have to remember it: resolve competing instruction files first; an empty repo settles the application stack in `prd-writer` before any style config can run; a scaffold takes style config immediately at blocking severity, then uses `tdd` stack-settlement mode when no test stack exists; a mature codebase takes style enforcement non-blocking and turns the violation count into plan phases. `agent-instructions` runs once after setup choices so it can capture both style and test commands.

Onboarding completion is a hard gate, not a best-effort summary: style setup, any required test-stack settlement, and the `agent-instructions` run must be evidenced, and the canonical instruction artifact must exist. `.github/agents/` definitions are execution roles and do not satisfy the repository's root `AGENTS.md` requirement. If an artifact or setup decision is missing, onboarding remains blocked and the next owning skill must be named directly; missing skill-owned setup is not by itself a request to rescope a phase.

For an empty repository, create the initial Git baseline after context, PRD, and plan artifacts exist but before the first scaffolding slice is executed. Keep the slice files out of that baseline, so the first slice's diff is reviewable on its own. The primary agent or user owns this commit boundary; `Engineer` never creates it.

If discovery contradicts the stated product purpose or behavior, surface the contradiction for resolution. Do not silently convert an inference into product truth.

### 2. Discover or clarify

If the repository is already known to be onboarded, start here directly with `/brain-storm` or the active `Brain Storm` agent for a new idea or an unsettled product direction. The agent follows the skill contract, asks focused questions about the problem, users, desired outcome, workflow branches, scope, constraints, success, and vocabulary, and must run as an active interactive agent rather than a one-shot subagent. When complete, it writes:

- `CONTEXT.md`: current product and domain truth.
- `UBIQUITOUS-LANGUAGE.md`: canonical terms and banned synonyms.

Do not proceed to the PRD while product decisions remain unresolved.

### 3. Define the target

Use `/prd-writer` or the active `PRD Writer` agent after context is current. It must run as an active interactive agent rather than a one-shot subagent. The PRD describes the target state only:

- required behaviors grouped by capability or workflow;
- scope refinements and non-goals not already settled in context;
- target architecture direction and hard constraints;
- acceptance signals and planner-safe assumptions.

The default PRD path is `docs/prd/<artifact-slug>-prd.md`, where `<artifact-slug>` comes from the settled project or product name in `UBIQUITOUS-LANGUAGE.md` and falls back to `CONTEXT.md` only when needed. The PRD must not contain progress, readiness, phases, slices, or implementation status.

Before finalizing, `prd-writer` checks any newly settled target architecture direction or hard constraint against the ADR test (hard to reverse, surprising without context, real trade-off among genuine alternatives) and hands off to `adr-writer` when it holds.

### 4. Plan the gap

Use `/work-planner` or the active `Work Planner` agent after the context and PRD are settled. It must run as an active interactive agent rather than a one-shot subagent. It compares repository reality with the PRD target and owns:

- current-state summaries;
- phase sequencing and dependencies;
- active slice detail;
- implementation status and plan drift.

The planner creates execution-ready slices. Every slice needs a user-visible outcome, file/module scope, every verification command needed to prove it, and observable acceptance checks. A slice that adds or changes a dependency boundary (network, database, filesystem, queue, external service, or process boundary) also carries an integration verification command, decided at planning time rather than inferred during execution.

Before finalizing, `work-planner` applies the same ADR test to any newly settled sequencing or implementation-architecture decision and hands off to `adr-writer` when it holds.

### 5. Execute a slice

Use `Orchestrator` to execute an approved plan, run as the active agent mode with both `agent` and `execute` tools — never dispatched through a subagent tool, which strips the tool parity it needs to dispatch `Engineer` and verify (see [docs/agents.md](agents.md)). It reads only the main plan, active phase invariants, and next slice, then copies those contents into an `Engineer` brief. It does not implement product code, invent slices, or rewrite the plan.

`Engineer` implements the assigned slice within scope. It clarifies ambiguity, favors the smallest change, verifies behavior, and reports changed files, the verification commands it ran with their results, and risks. Verification is the slice's own commands, run as written. After that verification passes, `Orchestrator` dispatches the custom user-defined `Review Subagent` with the Engineer Slice diff and directly affected Construction Paths; never use built-in `general-purpose`, whose `subagentStart` and `subagentStop` events do not fire.

Review Gate hooks inject compact Rule Metadata, load full Rule bodies only through the hook path, and fail closed on configuration failures. `subagentStop` blocks a response that cites a Rule ID not recorded as loaded for that review session. The Review Subagent returns all Findings together. Each Finding requires its own Developer disposition: Fix Once, Adopt Rule and Fix, or Dismiss. Fix Once and Adopt Rule and Fix return focused revision work to Engineer; after the revision and its required verification, Orchestrator dispatches a new complete review. Dismiss applies only to that Finding. A slice remains `in progress` until the final review says `No Findings`; Engineer verification alone never completes it.

Before dispatching a slice, `Orchestrator` must inspect the worktree for changes outside the assigned slice. Existing planner, product-truth, instruction, or unrelated implementation changes must be committed, isolated, or explicitly reconciled before dispatch, so the slice's diff stays reviewable.

For any behavior change, apply `/tdd` inside this implementation stage:

1. Settle the repository's test stack: framework, assertion style, test-double approach, placement, focused-run command, full-suite command. Discovered evidence beats convention; where a new scaffold has no evidence, run `/tdd` in stack-settlement mode before elaborating the first behavior slice and persist the choices through `/agent-instructions`. Never introduce or swap a testing package unasked.
2. Red: add one failing test for one behavior.
3. Green: make the smallest production change that passes.
4. Refactor: improve the design while keeping tests green.
5. Repeat for the remaining behavior.
6. Finish with the repository's full test suite.

When the active phase runs out of slices, `Orchestrator` does not exit the loop. If the next phase already has an approved phase document and nothing discovered in the completed phase invalidates it, `Orchestrator` expands that phase's slices from the phase document, records the transition in the main plan, and asks the user to confirm before dispatching the first one. That is elaboration of approved planning, not new planning: anything requiring a new or resequenced phase, a changed objective, or an undecided behavior stops and routes to `/work-planner`.

Mutation testing is opt-in and never assumed. When the user has enabled it through `/mutation-testing`, the agreed cadence (by default, each phase's final validation slice, scoped to the phase diff, unit tests only, measure-only until a backlog is cleared) determines which slices carry the mutation command per [`mutation-testing/references/PROTOCOL.md`](../.github/skills/mutation-testing/references/PROTOCOL.md). Survivors inside the current slice's scope are fixed inline like any failed verification; survivors outside that scope, or a large batch, escalate to `work-planner` as remediation slices.

### 6. Record and commit

After a successful slice, `Orchestrator` records status in the main plan. It stops after each slice unless asked to continue. Use `/conventional-commit` to inspect the diff, keep unrelated changes separate, and create a Conventional Commit for the coherent change.

Before reporting any durable side effect as complete — a commit, a Git baseline, a written or exported file, a plan status change — verify it against the filesystem or `git status`/`git log`/`git show`. A described action is not evidence that it occurred; a claimed commit or export that cannot be found in that verification did not happen and must be reported as failed, not retried silently or restated as success.

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
| Plan to orchestrator | The next slice has outcome, scope, verification commands, and acceptance checks |
| Orchestrator to engineer | Slice and active phase invariants are copied verbatim |
| Slice completion | Every stated verification command was run as written and passed, all Findings have specific dispositions, every required revision was re-reviewed, and the final Review Subagent report says `No Findings` |
| Phase transition | The next phase has an approved phase document that still holds; its slices are expanded and confirmed before the first dispatch |
| Commit | Staging scope is coherent and the message follows Conventional Commits 1.0.0 |

## Escalation Rules

- A changed problem, user, workflow, or vocabulary goes to `brain-storm`.
- A changed required behavior, scope boundary, hard constraint, or target architecture goes to `prd-writer`.
- A sequencing, dependency, status, or active-slice issue goes to `work-planner`.
- A phase boundary that needs a new, resequenced, or redefined phase goes to `work-planner`; expanding an already-approved phase's slices does not.
- A missing prerequisite already owned by a setup skill routes to that skill (`dotnet-editorconfig`, TDD stack settlement, or `agent-instructions`); it goes to `work-planner` only if sequencing or phase content must change.
- A slice that lacks a verification command stays blocked and returns to `work-planner`.
- A failed verification keeps the slice `in progress` until repaired and rerun.
- A blocked Review Gate hook, configuration failure, or unresolved Finding keeps the slice `in progress`; Fix Once and Adopt Rule and Fix return focused revision scope to Engineer and must be re-reviewed.
- A hard-to-reverse, surprising, real-trade-off technical decision goes to `adr-writer`; a routine or reversible one does not.

These rules prevent implementation discoveries from quietly changing product intent or target state.

## Active-Agent Transitions

`Brain Storm`, `PRD Writer`, and `Work Planner` are interactive active agents, not subagents. Their definitions disable model invocation so an agent cannot silently launch a stateless copy that loses the required user interview.

In VS Code, each completed forward transition offers a handoff button with a pre-filled prompt:

```text
Brain Storm -> PRD Writer -> Work Planner -> Orchestrator
```

During execution, `Orchestrator` also offers non-auto-submitting handoffs to `Brain Storm` for product-truth changes and `Work Planner` for replanning. An already-approved next phase follows `Orchestrator`'s Phase Transition instead; route to `Work Planner` only when the phase needs new or revised planning.

The buttons never auto-submit: the user reviews the artifacts and chooses the next stage. The CLI does not consume this metadata, so the user switches to the named active agent and uses the same prompt. The canonical artifacts and handoff gates remain authoritative in both harnesses.

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
