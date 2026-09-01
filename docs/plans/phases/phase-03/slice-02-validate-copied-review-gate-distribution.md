# Slice 02 - Validate Copied Review Gate Distribution

- **Slice kind:** verification-only
- **User-visible outcome:** an external integration test proves that a copied `.github/` directory installs an operational Review Gate in a clean target repository.
- **Backend/data slice:** add an external portability integration test that copies only `.github/` into a temporary target repository and proves each configured hook resolves and executes its packaged JavaScript entry point under the documented stdin/stdout contract without copying or invoking the source test suite in that repository.
- **UI/workflow slice:** none; this slice validates the packaged workflow without changing its agent or Developer interaction contracts.
- **Files/modules in scope:** `test/review-gate/`; `.github/review-gate/runtime/`; `.github/review-gate/rules/`; `.github/hooks/review-gate.json`; `.github/agents/review-subagent.agent.md`; `.github/agents/orchestrator.agent.md`.
- **Verification commands:** `node --test test/review-gate/portable-distribution.test.mjs`; `node --test test/review-gate/*.test.mjs`
- **Acceptance checks:** the temporary target contains the copied `.github/` operational package but no copied Review Gate test or fixture directory; every command configured in `.github/hooks/review-gate.json` resolves beneath the copied `.github/` and executes successfully for a valid event supplied by the external test; no hook execution depends on source-repository runtime files; the integration test cleans up its temporary repository.
- **Useful-if-stopped statement:** the `.github/` package has executable evidence that it operates independently of this source repository's top-level layout.