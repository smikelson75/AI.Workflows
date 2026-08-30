# Slice 03 - Block Slice Completion on Review State

- **User-visible outcome:** an Engineer Slice cannot be marked completed until Review Gate has no unresolved Findings, and a Finding cannot cite a Rule that the hook path did not load.
- **Backend/data slice:** add the `subagentStop` citation-enforcement hook and Review Subagent definition; update Orchestrator review-state handling and its workflow contracts.
- **UI/workflow slice:** the documented Engineer-to-Review-Subagent-to-Developer loop returns focused revision work after Fix Once and re-reviews every required revision.
- **Files/modules in scope:** `.github/agents/`; `.github/hooks/`; `scripts/review-gate/`; `test/review-gate/`; `docs/agents.md`; `docs/artifacts.md`; `docs/workflow.md`; `README.md`.
- **Verification commands:** `node --test test/review-gate/review-completion.test.mjs`
- **Acceptance checks:** Review Subagent is a custom user-defined agent; a `subagentStop` fixture blocks a Finding that cites an unloaded Rule ID; a clean review can pass; unresolved Findings prevent completion; Fix Once returns focused revision scope and triggers re-review; all contract documents describe the same blocking loop; hook configuration failures fail closed.
- **Useful-if-stopped statement:** no documented execution path can complete after Engineer verification alone.
