# Slice 01 - Enforce Rule Loading Through Hooks

- **User-visible outcome:** a Review Subagent receives compact active Rule Metadata at startup and can load a selected Rule body only through a deterministic hook path.
- **Backend/data slice:** add repository hook configuration and synchronous hook scripts for `subagentStart` and `preToolUse`; track Rule IDs loaded for the review session; add fixture-driven Node tests.
- **UI/workflow slice:** none.
- **Files/modules in scope:** `.github/hooks/`; `scripts/review-gate/`; `test/review-gate/`.
- **Verification commands:** `node --test test/review-gate/hook-rule-loading.test.mjs`
- **Acceptance checks:** a `subagentStart` fixture injects only active Rule Metadata; a `preToolUse` fixture for a selected active Rule returns its full policy and records its ID for that session; malformed input, Catalog failure, and an unknown Rule fail closed; no hook script reads unselected Rule bodies.
- **Useful-if-stopped statement:** Rule selection and full-body loading are enforced outside the Review Subagent before its decision workflow is wired.
