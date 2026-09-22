# Slice 04 - Artifact layer integration and E2E verification (integration/E2E)

- **User-visible outcome:** Against a realistic fixture repository, the artifact layer reads a full phase and its slices end to end and fails closed with the correct stable identifier for every malformed case, proving Phase 05's vertical behavior against the approved acceptance feature.
- **Backend/data slice:** Build an integration-level fixture that creates a temporary Git repository containing a `.workflow/plans/phases/phase-NN/` tree with a phase artifact and multiple slice artifacts, plus an `out/` directory. Implement every non-excepted `@e2e` scenario in `acceptance.feature`, covering the positive read path and the caller-visible failure contracts: rejected `repo_path` causes, absent frontmatter, unparsable YAML, missing required field, unknown field, and missing artifact. Assert the exact error identifier and structured details for each rejection, and assert that every rejection leaves the fixture repository byte-identical, since the artifact layer performs no writes in this phase. Verify that every `@unit` and `@integration` scenario ID in `acceptance.feature` maps to an executable test, and record any approved exception explicitly. If an approved scenario cannot run because the fixture harness is insufficient, remediate the harness within this slice.
- **UI/workflow slice:** None.
- **Files/modules in scope:** `.workflow/plans/phases/phase-05/acceptance.feature` (read-only reference for traceability), `packages/verification-mcp-server/test/integration/**`, `test/e2e/**`, `test/helpers/**`, `test/fixtures/**`. Source changes are limited to defects the integration run exposes; new behavior returns to an earlier slice.
- **Verification command:**
  - static: `npm --prefix packages/verification-mcp-server run verify`
  - unit: `npm --prefix packages/verification-mcp-server test`
  - integration and E2E: `npm --prefix packages/verification-mcp-server test`
  - mutation: `npm --prefix packages/verification-mcp-server run test:mutation`
- **Acceptance checks:**
  - Every non-excepted `@e2e` scenario in `phases/phase-05/acceptance.feature` has an executable test that passes.
  - Every `@unit` and `@integration` scenario ID in that feature maps to a named executable test, and the mapping is asserted by a traceability test rather than by inspection.
  - Each rejection scenario asserts its exact stable error identifier and its structured details, not merely that an error occurred.
  - After every rejection scenario, the fixture repository contents are unchanged.
  - Fixture repositories are created under the OS temporary directory and removed on teardown, leaving no residue in the working tree.
  - The phase-scoped mutation run completes and meets the threshold configured in Slice 01.
- **Useful-if-stopped statement:** Phase 05 closes with executable proof that the package's artifact reads and fail-closed contract behave as specified, establishing the verification baseline that Phases 06 through 10 extend.
