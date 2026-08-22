# Mutation Testing Protocol

Stack-agnostic requirements for any mutation-testing adapter. An adapter supplies the tool, config format, and stack-specific scoping mechanics; this file supplies the rules that do not change between stacks.

## Outcome

Mutation testing measures whether the test suite actually detects introduced faults (a mutation score). This is a different signal than coverage: coverage proves a line executed, mutation testing proves a test would fail if the line's behavior changed.

## Cadence

Runs at each phase's **final end-to-end validation slice**, scoped incrementally to that phase's diff since phase start — not every slice, not only at release.

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

- **No code yet** — not applicable; mutation testing waits for a scaffolding slice.
- **Scaffold, no real tests yet** — not applicable yet, but this is the clean case: no legacy debt to measure. The adapter activates cold at phase 1's final end-to-end validation slice; no baseline run is needed.
- **Mature codebase, no test suite at all** — blocked. Mutation testing cannot run without tests to kill mutants. Hand this to `work-planner` as a required prerequisite phase (write a baseline test suite) before any mutation-testing phase can start.
- **Mature codebase, existing test suite** — no prior phase boundary exists yet to scope an incremental diff against. Offer a one-time, **opt-in, cost-flagged** full-repository baseline run: non-blocking, reporting score and survivor hotspots to `work-planner` as backlog. Do not run this automatically the way a cheap linter runs automatically — the cost can be large, and the user should choose to pay it. After the baseline (or if declined), the incremental per-phase cadence takes over from the next phase forward.

## Survivor Remediation After A Run

- Survivors inside the current slice's own file scope: fix inline. This is the same as any other failed verification — the slice stays `in progress` until repaired and rerun. No plan edit needed.
- Survivors outside the current slice's scope (implicating an earlier, already-completed slice), or a batch large enough to be its own body of work: escalate to `work-planner` as remediation slice(s), the same way a `code-style` violation count becomes remediation phases. Judge "large" qualitatively; do not silently absorb an open-ended amount of extra work into a slice meant to close out a phase.

## Non-Negotiables

1. Root-level configuration is the source of truth for scope, thresholds, and exclusions.
2. Default scope is unit-level only, as above.
3. First cycle on newly enabled work is measure-only; blocking is a deliberate later step.
4. A low score is resolved by writing a better test or by an explicit, recorded scope decision — never by silently weakening a test or lowering a threshold to pass.
5. Config changes are their own commit, never mixed with behavior changes.

## Boundaries For Every Adapter

- Does not replace the stack's TDD skill; mutation testing measures existing tests, it does not define how tests are written.
- Does not run every slice by default.
- Does not choose numeric thresholds unilaterally; proposes them to the user via a guided walkthrough and confirms before writing config.
- Escalates to `adr-writer` only when the enforcement choice is hard to reverse and genuinely contested (for example, blocking enforcement across a large legacy codebase, or a decision to permanently exclude a layer from mutation scope).
