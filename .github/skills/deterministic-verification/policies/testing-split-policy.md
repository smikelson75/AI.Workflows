# Testing Split Policy

Owner: `deterministic-verification`

Use two implementation passes only when the integration gate requires it.

## Pass A

Engineer A implements the behavior and unit tests following the shared TDD protocol (or justified non-behavior path). For behavior changes, Engineer A records Red evidence, runs the slice's test-bearing unit verification command, runs static verification in addition to tests, and writes an Engineer A report containing structured verification evidence.

## Pass B

Engineer B adds or updates integration tests for the gate's targets and makes only the harness changes required to run them. Engineer B does not refactor production behavior. If integration tests expose a behavior defect, return a focused follow-up to Engineer A.

## Completion

A slice is complete only after its required report and verification evidence exist. A boundary-changing slice requires either a gate result explicitly saying integration is not required or a passing Engineer B report.
