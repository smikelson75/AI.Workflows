# Slice 02 - Validate Catalog Behavior (integration/E2E)

- **User-visible outcome:** the catalog proves that Rule selection remains token-efficient without weakening policy enforcement.
- **Backend/data slice:** complete full-Rule retrieval behavior and integration tests across the seeded Rules and malformed active Rule cases.
- **UI/workflow slice:** none.
- **Files/modules in scope:** `.github/review-gate/rules/`; `scripts/review-gate/rule-catalog.mjs`; `test/review-gate/rule-catalog.test.mjs`.
- **Verification commands:** `node --test test/review-gate/rule-catalog.test.mjs`
- **Acceptance checks:** a selected Rule returns its criteria, rationale, exceptions, examples, and review guidance; no unselected Rule body is returned by metadata discovery; failures to parse, validate, or load an active Rule surface as failures; the Simple Constructor Rule permits named-state Static Factories; the Complex Constructor Rule identifies both five required parameters and ambiguous parameter combinations.
- **Useful-if-stopped statement:** the policy boundary is proven ready for a blocking review workflow without requiring all Rules in each review context.
