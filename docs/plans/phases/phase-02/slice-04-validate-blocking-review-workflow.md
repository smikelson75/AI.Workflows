# Slice 04 - Validate the Blocking Review Workflow (integration/E2E)

- **User-visible outcome:** the composed fixture-driven review workflow proves that valid review completion is possible and that every required enforcement path blocks safely.
- **Backend/data slice:** complete integration fixtures that execute the three hook scripts in lifecycle order with the Rule Catalog, session tracking, decision journal, and adopted Rules.
- **UI/workflow slice:** none.
- **Files/modules in scope:** `.github/hooks/`; `.github/review-gate/`; `scripts/review-gate/`; `test/review-gate/`; `.github/agents/review-subagent.agent.md`; `.github/agents/orchestrator.agent.md`; `docs/agents.md`; `docs/artifacts.md`; `docs/workflow.md`; `README.md`.
- **Verification commands:** `node --test test/review-gate/*.test.mjs`
- **Acceptance checks:** fixture sequences show compact metadata injection, selected Rule loading, and successful clean completion; matching code produces an evidence-backed blocking Finding; an unloaded Rule citation is blocked at `subagentStop`; Fix Once is re-reviewed; Adopt Rule and Fix activates a repository-wide Rule and records its path; Dismiss remains scoped to its Finding; malformed hook input and Catalog failures fail closed; Phase 01 catalog tests remain passing.
- **Useful-if-stopped statement:** the blocking review handoff is proven without requiring a live Copilot CLI session.
