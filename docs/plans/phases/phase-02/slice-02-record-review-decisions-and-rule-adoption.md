# Slice 02 - Record Review Decisions and Rule Adoption

- **User-visible outcome:** a Developer can disposition a numbered Finding, and an Adopt Rule and Fix decision creates an active repository-wide Rule with a durable decision record.
- **Backend/data slice:** add the append-only JSON Lines Decision Journal, Rule adoption generation and activation, and focused Node tests.
- **UI/workflow slice:** define the combined numbered Finding report and per-Finding Developer disposition contract in the Review Subagent workflow.
- **Files/modules in scope:** `.github/agents/review-subagent.agent.md`; `.github/review-gate/rules/`; `scripts/review-gate/`; `test/review-gate/`; `docs/artifacts.md`.
- **Verification commands:** `node --test test/review-gate/decision-journal.test.mjs`
- **Acceptance checks:** findings are reported together with stable numbers; Fix Once, Adopt Rule and Fix, and Dismiss each write a specific append-only decision; adopting creates and activates complete Rule content with its path recorded; a dismissal does not suppress future matching findings; malformed decisions and Rule-generation failures surface as failures.
- **Useful-if-stopped statement:** Developer decisions and adopted Rules are durable even before completion blocking is connected.
