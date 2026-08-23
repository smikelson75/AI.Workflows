# Phase-End E2E Policy

Owner: `deterministic-verification`

End-to-end validation runs once at phase end, after all phase slices and required integration checks are complete. E2E validates the assembled workflow across its user-visible boundaries; it does not replace unit or slice-level integration tests.

The phase-final command must be supplied by the phase plan or `E2E_COMMAND`. Missing commands are errors. Results belong in the phase handoff or plan status record, not in a duplicate session log.
