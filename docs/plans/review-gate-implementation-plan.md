# Review Gate implementation plan

## Problem and approach

- Build the blocking post-Engineer Review Gate defined in [`review-gate-prd.md`](../prd/review-gate-prd.md).
- Establish tested, lazy-loaded Rule policy first; then integrate the Review Subagent and decision loop into Orchestrator.

## Current state and gap

- **Project type:** workflow, skill, and agent contract repository.
- **Maturity:** documented workflow and Engineer/Orchestrator agent contracts exist; no Review Gate plan existed.
- **Architecture in place:** orchestrator dispatches only Engineer and marks a slice complete after Engineer verification.
- **Implemented areas:** no Rule Catalog, Rule documents, Review Subagent, Decision Journal, Copilot CLI hook configuration, hook scripts, or JavaScript test baseline exists.
- **Known constraints:** the current worktree contains uncommitted workflow and product-artifact changes outside future Engineer slice scope; isolate or commit them before dispatch. JavaScript verification uses `node --test`. Rule Catalog invocation and Finding-citation enforcement are hook-driven, not agent-tool-call-driven: `subagentStart` and `preToolUse` hooks call the Rule Catalog, and `subagentStop` blocks completion when a Finding cites an unloaded Rule, independent of Orchestrator ([ADR 0001](../adr/0001-hook-enforced-rule-loading.md)). Review Subagent must be a user-defined custom agent, not the built-in `general-purpose` agent, because `subagentStart`/`subagentStop` do not fire for `general-purpose`. No repository harness exists for firing real Copilot CLI hook events end-to-end, so hook scripts are verified directly against their documented stdin/stdout contract.
- **Readiness:** Phase 01 can establish the isolated Rule Catalog foundation.

## Active work

- **Current phase:** [Phase 01 - Rule Catalog Foundation](phases/phase-01/phase.md)
- **Next slice:** [Slice 01 - Load Rule Metadata](phases/phase-01/slice-01-load-rule-metadata.md)
- **Blockers:** none.

## Phase plan

| # | Phase | Status | Outcome | Detail |
|---|-------|--------|---------|--------|
| 01 | Rule Catalog Foundation | in progress | Active Rules are validated, lazily loadable policy documents with seeded construction guidance. | [detail](phases/phase-01/phase.md) |
| 02 | Blocking Review Workflow | planned | Engineer Slices receive evidence-backed review decisions and cannot complete with unresolved Findings. | [detail](phases/phase-02/phase.md) |

## Slice status - Phase 01

| # | Slice | Status | Detail |
|---|-------|--------|--------|
| 01 | Load Rule Metadata | planned | [detail](phases/phase-01/slice-01-load-rule-metadata.md) |
| 02 | Validate Catalog Behavior (integration/E2E) | planned | [detail](phases/phase-01/slice-02-validate-catalog-behavior.md) |
