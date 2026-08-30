# Slice 01 - Load Rule Metadata

- **User-visible outcome:** active construction Rules are independently stored and the Rule Catalog exposes only their validated metadata for initial review selection.
- **Backend/data slice:** add the Rule document location, the two active seeded Rule files, a dependency-free JavaScript Rule Catalog loader, and focused tests for valid metadata discovery and validation failures.
- **UI/workflow slice:** none.
- **Files/modules in scope:** `.github/review-gate/rules/`; `scripts/review-gate/rule-catalog.mjs`; `test/review-gate/rule-catalog.test.mjs`.
- **Verification commands:** `node --test test/review-gate/rule-catalog.test.mjs`
- **Acceptance checks:** each seeded Rule has required Metadata and complete Markdown policy content; catalog discovery exposes only `id`, `title`, `status`, `scope`, `triggers`, `summary`, and optional `language`/`tags`; invalid required metadata makes active catalog loading fail; discovery does not return Rule bodies.
- **Useful-if-stopped statement:** later workflow work has a stable, tested metadata-selection boundary and two concrete active Rules.
