# Review Gate implementation plan

## Problem and approach

- Build the blocking post-Engineer Review Gate defined in [`review-gate-prd.md`](../prd/review-gate-prd.md).
- Preserve the completed Rule and blocking-review behavior, package its operational runtime as a self-contained `.github/` distribution, and keep development validation outside that distribution.

## Current state and gap

- **Project type:** workflow, skill, and agent contract repository.
- **Maturity:** the Rule Catalog, Review Gate hooks, Decision Journal, custom Review Subagent, Orchestrator gate, seeded Rules, and JavaScript verification suite are implemented and tested.
- **Architecture in place:** the JavaScript runtime has been copied to `.github/review-gate/runtime/` and the original top-level runtime removed, but hook commands and artifact documentation still reference `scripts/review-gate/`; tests and fixtures have also been copied under `.github/review-gate/test/` and removed from their required external `test/review-gate/` location.
- **Implemented areas:** Phases 01 and 02 established lazy Rule loading, hook-enforced citation validation, Finding decisions, re-review, and blocking slice completion.
- **In-progress areas:** Slice 01 has partially relocated runtime and tests; it must retain the runtime move, restore tests and fixtures outside `.github/`, and complete hook and documentation path updates.
- **Absent areas required by the PRD target:** external development tests that validate the packaged runtime, hook commands that resolve only within `.github/`, current artifact documentation for the operational package, and an external copied-directory integration test in a clean target repository.
- **Known constraints:** JavaScript verification uses `node --test`; Node.js is the only permitted external runtime dependency. Relocation must preserve hook stdin/stdout behavior, session isolation, Rule paths, Decision Journal paths, and the custom Review Subagent boundary established by [ADR 0001](../adr/0001-hook-enforced-rule-loading.md). Development tests and fixtures must not ship under `.github/`. Completed phase and slice documents retain their original paths as historical planning baselines.
- **Readiness:** the partial relocation is bounded and reversible within Slice 01; runtime files already exist at their target path, and tests can be restored to `test/review-gate/` before hook and documentation references are finalized.

## Active work

- **Current phase:** [Phase 03 - Portable Review Gate Distribution](phases/phase-03/phase.md)
- **Next slice:** [Slice 02 - Validate Copied Review Gate Distribution](phases/phase-03/slice-02-validate-copied-review-gate-distribution.md)
- **Blockers:** none.

## Phase plan

| # | Phase | Status | Outcome | Detail |
|---|-------|--------|---------|--------|
| 01 | Rule Catalog Foundation | completed | Active Rules are validated, lazily loadable policy documents with seeded construction guidance. | [detail](phases/phase-01/phase.md) |
| 02 | Blocking Review Workflow | completed | Engineer Slices receive evidence-backed review decisions and cannot complete with unresolved Findings. | [detail](phases/phase-02/phase.md) |
| 03 | Portable Review Gate Distribution | in progress | Copying `.github/` installs an operational and independently verifiable Review Gate. | [detail](phases/phase-03/phase.md) |

## Slice status - Phase 03

| # | Slice | Status | Detail |
|---|-------|--------|--------|
| 01 | Package Review Gate Under .github | completed | [detail](phases/phase-03/slice-01-package-review-gate-under-github.md) |
| 02 | Validate Copied Review Gate Distribution (integration/E2E) | planned | [detail](phases/phase-03/slice-02-validate-copied-review-gate-distribution.md) |
