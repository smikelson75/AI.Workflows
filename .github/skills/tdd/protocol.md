# TDD Protocol

Core rule: not done until all tests pass.

## Behavior-Changing Slices

For every slice that introduces or modifies runtime behavior, execute this loop:

1. **Select one behavior:** Choose one observable behavior or outcome partition.
2. **Add/update focused test:** Add or modify a single focused test covering that behavior.
3. **Observe Red:** Run the focused test and confirm it fails for the expected reason (not syntax error or harness crash).
4. **Record Red evidence:** Note the focused test command, expected failure message/condition, and observed failure.
5. **Smallest Green:** Implement the minimal production code needed to make the test pass.
6. **Confirm Green:** Rerun the focused test and confirm it passes.
7. **Refactor:** Improve readability, structure, or deduplicate only while all tests pass.
8. **Repeat:** Continue until all required slice behaviors are implemented.
9. **Full suite:** Run the full project/package test suite.
10. **Static verification:** Run static analysis (typecheck, lint, formatting) in addition to tests, never instead of tests.

## Non-Behavior Changes

Changes that do not alter runtime behavior—such as documentation updates, workflow contracts, template revisions, mechanical formatting, or build configuration—may mark TDD not applicable.
- The slice report must provide a specific `tddNotApplicableReason`.
- Focused verification is still required (e.g. static analysis, documentation linting, schema validation, or manual check command).

## Execution Invariants

- Test before production code change.
- Never substitute static verification or compilation for automated test execution on behavior slices.
- Record durable Red evidence for the slice report.
- Never mark complete with failing tests.
