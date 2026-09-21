# Mutation Testing Protocol

Stack-agnostic requirements for any mutation-testing adapter. An adapter supplies the tool, config format, and stack-specific scoping mechanics; this file supplies the rules that do not change between stacks.

## Onboarding Input

When invoked from `onboard-project` with an in-memory [onboarding handoff](../onboard-project/references/ONBOARDING-HANDOFF.md), adapters receive `onboarding_mode`, `repository_scope`, and `detected_stacks`. The adapter:
1. Self-assesses whether unit test projects exist and whether root configuration is already established (idempotent re-entry).
2. If supported, establishes root configuration (e.g., `stryker-config.json` or `stryker.config.json`) with measure-only baseline thresholds (`break: 0`).
3. For mature repositories, self-assesses test-suite presence: if absent, reports the prerequisite test suite gap; if present, offers the opt-in baseline run.
4. If no adapter exists for a detected stack, reports the missing adapter plainly so onboarding can continue routing supported stacks.
5. Returns a concise outcome to the caller; never writes an onboarding status or TODO artifact.

When invoked directly without an onboarding envelope, adapters detect stack and test configuration locally without assuming maturity.

## Outcome

Mutation testing measures whether the test suite actually detects introduced faults (a mutation score). This is a different signal than coverage: coverage proves a line executed, mutation testing proves a test would fail if the line's behavior changed.

## Cadence

Runs at each phase's **final end-to-end validation slice**, scoped incrementally to that phase's diff since phase start — not every slice, not only at release.

- Mutation testing does not get its own slice; it is wired directly into that final slice's verification command alongside the integration/E2E test suite.
- Not every slice: a mutation run reruns the suite per surviving mutant. It does not fit the fast Red-Green-Refactor inner loop, and running it there would make that loop unusable.
- Not release-only: by then, multiple phases of weak tests would already be entrenched, defeating shift-left testing and turning remediation into a big-bang cleanup.
- Incremental scoping (diff since phase start, not the whole repository) keeps cost proportional to the phase.

## Test Scope

Mutate and score using **unit tests only**, by default. Integration and end-to-end tests are permanently excluded, both as mutation targets and as mutant killers:

- **Cost**: a mutant re-triggers whatever its covering tests touch. Integration/e2e tests are slow and often carry real side effects (network calls, containers, external quota) that multiply badly across hundreds of mutants.
- **Signal**: integration/e2e tests assert at a coarse boundary and often survive a mutant that changes fine-grained internal logic, producing a weak kill signal even at high cost.
- Logic that only an integration/e2e test can exercise is an architecture-boundary signal (move the logic to a unit-testable layer) — not a reason to widen mutation scope into those tests.

This mutation-only scope rule does not relax normal verification expectations: integration tests are still expected in slices that add or change dependency boundaries (network, database, filesystem, queues, external services).

## Blocking Policy

- First cycle on any newly enabled phase or repository: **measure-only**. Report the mutation score and the list of survived mutants; do not fail the verification command.
- Hand the survivor list to `work-planner` as backlog once measured.
- Tighten to a blocking threshold only after that backlog is cleared.
- Never resolve a low score by weakening or deleting a hard-to-kill test, or by quietly excluding code from mutation scope, without an explicit, recorded decision. This mirrors the `code-style` protocol's "never lower a severity to pass" rule.
- Threshold values (score bands) are not defined here; the stack adapter proposes them to the user through a guided walkthrough, since the right bar depends on the codebase and risk tolerance.

## Repository Maturity Paths

First-run behavior depends on two independent facts: code maturity (empty/scaffold/mature) and whether a meaningful test suite already exists.

- **No code yet** — waits for Phase 0 scaffolding. Once Phase 0 establishes the test harness, the adapter configures root-level config at measure-only (`break: 0`) before feature phases begin.
- **Scaffold / new projects with test harness** — clean case with no legacy debt. The adapter configures root configuration during onboarding at measure-only (`break: 0`), ready for phase 1's final end-to-end validation slice; no baseline run is needed.
- **Mature codebase, no test suite at all** — blocked. Mutation testing cannot run without tests to kill mutants. Hand this to `work-planner` as a required prerequisite phase (write a baseline test suite) before any mutation-testing phase can start.
- **Mature codebase, existing test suite** — no prior phase boundary exists yet to scope an incremental diff against. Offer a one-time, **opt-in, cost-flagged** full-repository baseline run: non-blocking, reporting score and survivor hotspots to `work-planner` as backlog. Do not run this automatically the way a cheap linter runs automatically — the cost can be large, and the user should choose to pay it. After the baseline (or if declined), the incremental per-phase cadence takes over from the next phase forward.

## Run Completeness

A mutation run must **complete and produce a score over the intended scope**. An incomplete or silently narrowed run is a blocker, not a warning — it inflates the apparent score by removing exactly the code the tooling could not handle.

Treat any of the following as an incomplete run:

- The tool could not start or crashed (missing runtime, tool not installed, environment/OS policy block, build failure).
- Mutants failed to compile or type-check, causing the tool to drop mutants — and especially when it drops **all** mutants in an enclosing method, class, or file.
- Mutants timed out in volume, or the run was cut short by a time or token limit.
- The effective `mutate` scope resolved to zero files, or to far less than the phase diff.
- No tests were discovered for a project inside the mutate scope.

Required handling:

1. **Do not report a score from an incomplete run** as if it were a result. Report the score alongside an explicit completeness statement: what was dropped, where, and why.
2. **Never substitute a passing test suite for a missing mutation run.** If the mutation command in the final integration slice did not execute to completion, the slice's verification has not passed.
3. **Surface it to the user** through the caller's decision menu, with the affected symbols named and a concrete proposed fix for each cause — not a generic "mutation testing failed".
4. **Propose a fix, do not apply one unilaterally.** Dropped-mutant causes are usually code-shape or tool-configuration problems whose fix touches files outside the current slice. Fixes inside the slice's own scope may be applied inline; anything wider is routed to `work-planner` as a remediation slice after the user chooses.
5. **Excluding the affected code is not a fix** unless the user records the decision explicitly, per non-negotiable 4.
6. The run is re-executed after the fix. The phase does not close on an incomplete mutation run.

Adapters supply the stack-specific detection signals (tool output strings, exit codes, log patterns) and the corresponding suggested fixes.

## Survivor Remediation After A Run

- Survivors inside the current slice's own file scope: fix inline. This is the same as any other failed verification — the slice stays `in progress` until repaired and rerun. No plan edit needed.
- Survivors outside the current slice's scope (implicating an earlier, already-completed slice), or a batch large enough to be its own body of work: escalate to `work-planner` as remediation slice(s), the same way a `code-style` violation count becomes remediation phases. Judge "large" qualitatively; do not silently absorb an open-ended amount of extra work into a slice meant to close out a phase.

## Non-Negotiables

1. Root-level configuration is the source of truth for scope, thresholds, and exclusions.
2. Default scope is unit-level only, as above.
3. First cycle on newly enabled work is measure-only; blocking is a deliberate later step.
4. A low score is resolved by writing a better test or by an explicit, recorded scope decision — never by silently weakening a test or lowering a threshold to pass.
5. Config changes are their own commit, never mixed with behavior changes.
6. Mutation testing does not get its own phase or slice; it runs as part of the phase-final integration/E2E slice's verification command (except for prerequisite test-writing or survivor remediation backlogs).
7. The run must complete over its intended scope. An incomplete run (see Run Completeness) is escalated to the user with named causes and proposed fixes, and is never reported as a pass or replaced by a passing test suite.

## Boundaries For Every Adapter

- Does not replace the stack's TDD skill; mutation testing measures existing tests, it does not define how tests are written.
- Does not run every slice by default.
- Does not choose numeric thresholds unilaterally; proposes them to the user via a guided walkthrough and confirms before writing config.
- Escalates to `adr-writer` only when the enforcement choice is hard to reverse and genuinely contested (for example, blocking enforcement across a large legacy codebase, or a decision to permanently exclude a layer from mutation scope).
