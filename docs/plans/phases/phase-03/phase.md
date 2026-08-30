# Phase 03 - Portable Review Gate Distribution

- **Phase objective:** make `.github/` the complete distribution boundary for repository-owned Review Gate operational assets while retaining development validation outside that boundary.
- **User-visible outcome:** a Developer can copy `.github/` into a target repository and receive an operational Review Gate without another copy step, path rewriting, or bundled development tests.
- **Backend/data scope:** relocate the JavaScript Rule Catalog, Decision Journal support, session store, and hook entry points beneath `.github/review-gate/runtime/`; keep the test suite and fixtures under `test/review-gate/`; repoint hook commands and module references; validate the copied operational package from the external test suite.
- **UI/workflow scope:** update current artifact and repository-layout documentation to distinguish packaged operational assets from source-repository validation assets; agent behavior and Finding disposition workflow remain unchanged.
- **Cross-slice invariants:** every repository-owned operational dependency required by Review Gate remains under `.github/`; development tests and fixtures remain outside `.github/`; Node.js remains the only external runtime dependency; hook stdin/stdout contracts, fail-closed behavior, Rule and Decision Journal paths, session isolation, and Review Subagent behavior remain unchanged; custom agent contracts remain path-agnostic unless they directly execute a packaged asset; completed phase artifacts remain unchanged as historical planning baselines.
- **Prerequisites:** Phases 01 and 02 are completed; the amended PRD defines `.github/` as the portable distribution boundary.
- **Blockers:** none.
- **Acceptance checks:** no active hook command or packaged JavaScript module depends on repository-owned runtime assets outside `.github/`; `.github/` contains no Review Gate tests or fixtures; the external suite passes; copying `.github/` into a clean target repository preserves configured hook entry-point resolution and execution.
- **Useful-if-stopped statement:** after the first slice, the repository has one coherent operational package and external regression suite even before independent-copy validation is added.
- **Risks and mitigations:** external test imports can accidentally validate source paths instead of packaged runtime paths, so tests must import `.github/review-gate/runtime/` explicitly; copied-directory validation must execute hooks from a temporary target root containing only the packaged `.github/` and minimal fixture input.
- **Test checkpoints:** run the external complete suite after restoring its location and imports; then run the dedicated clean-copy test and complete external suite for phase completion.
- **Definition of done:** `.github/` contains every repository-owned Review Gate operational asset and no development tests, configured hooks execute packaged entry points, current documentation names both layout boundaries, and external clean-copy integration validation passes.

## Slice order

1. [Slice 01 - Package Review Gate Under .github](slice-01-package-review-gate-under-github.md)
2. [Slice 02 - Validate Copied Review Gate Distribution (integration/E2E)](slice-02-validate-copied-review-gate-distribution.md)