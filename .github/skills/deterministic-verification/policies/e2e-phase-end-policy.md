# Phase-End E2E Policy

Owner: `deterministic-verification`

End-to-end validation runs in the final phase slice, after prior slices and their required integration checks are complete. E2E validates the assembled workflow across its user-visible boundaries; it does not replace unit or slice-level integration tests.

The final slice cannot start until the main plan records human approval of the phase's `acceptance.feature`. `Engineer` implements every non-excepted `@e2e` scenario and confirms that `@unit` and `@integration` scenario IDs map to executable tests. Missing mappings, unapproved changes, and undocumented exceptions fail the slice.

The phase-final command must be supplied by the phase plan or `E2E_COMMAND`. Missing commands are errors. Results belong in the phase handoff or plan status record, not in a duplicate session log. `qa-design` owns scenario changes; `Engineer` must route infeasible or incorrect scenarios back for revision and renewed human approval rather than editing the feature.
