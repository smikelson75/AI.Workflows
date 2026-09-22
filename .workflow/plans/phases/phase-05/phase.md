# Phase 05 - Package Foundation & Artifact Layer

- **Phase objective:** Stand up `packages/verification-mcp-server` as an installable, verifiable TypeScript package whose artifact layer resolves an explicit `Repository Root` and reads machine-readable fields from YAML frontmatter on phase and slice artifacts, failing closed with stable error identifiers.
- **User-visible outcome:** A caller can point the package at a `repo_path` and get back either the machine-readable fields of the named phase and slice artifacts, or a fail-closed error naming the exact artifact and field that is missing or malformed.
- **Backend/data scope:** Package manifest, TypeScript and lint configuration, mutation-testing adapter config, shared typed models, the fail-closed error identifier registry, repository root resolution, and the artifact layer covering `.workflow/` and `out/` reads.
- **UI/workflow scope:** None. No MCP transport and no command-line entry point in this phase; the artifact layer is exercised directly through its exported functions.
- **Cross-slice invariants:**
  - Every entry point takes `repo_path` explicitly; nothing in this package reads `process.cwd()` to locate a repository.
  - Only the artifact layer touches the filesystem; models and error definitions stay pure.
  - Every failure surfaces a stable machine-readable error identifier plus the offending artifact and field; no failure is a bare thrown string or a boolean.
  - Machine-readable fields come from YAML frontmatter only; no prose parsing, no heuristic fallback (ADR 0003).
  - No policy decisions live here. Classification, validation, gating, and status derivation belong to Phases 06 and 07.
  - Strict TypeScript, ESM, native `node:test`, and zero shell strings, matching the `git-mcp-server` conventions.
- **Prerequisites:** Node.js >= 22.12.0 and Git on PATH.
- **Blockers:** No root StrykerJS configuration exists; Slice 01 must create it via the `stryker-js` skill so the phase-final slice can run phase-scoped mutation testing.
- **Acceptance checks:**
  - The package installs, builds, type-checks, lints, and formats clean from a cold clone.
  - Reading a well-formed fixture repository returns the declared frontmatter fields for the named phase and slice.
  - A `repo_path` that is absent, not a directory, or outside a Git repository is rejected with a distinct stable error identifier per cause.
  - A workflow artifact with absent frontmatter, unparsable YAML, or a missing required field is rejected with a stable error identifier naming the artifact path and the field.
  - Every error identifier emitted by the package is declared in a single registry and covered by a test.
- **Useful-if-stopped statement:** Even if the phase stops after Slice 03, the repository gains an installable, verified package that can deterministically read frontmatter-bearing workflow artifacts, which every later phase consumes.
- **Risks and mitigations:**
  - Risk: the frontmatter field set is designed before Phases 06-08 reveal what they need. Mitigation: derive the field set from the existing report schemas and fail-closed rules under `.github/skills/deterministic-verification/`, and treat additive fields as later-phase work rather than redesign.
  - Risk: fixture repositories leak into the real working tree. Mitigation: all fixtures are created under the OS temporary directory and removed on teardown.
  - Risk: mutation-testing setup is deferred and silently never happens. Mitigation: it is an explicit Slice 01 deliverable and a Phase 05 blocker until done.
- **Test checkpoints:** Unit tests per slice against in-memory and temporary-directory fixtures; an integration test exercising a complete fixture repository in the final slice; phase-scoped mutation testing in the final slice.
- **Definition of done:** The package's verify, unit, and integration gates pass; every non-excepted `@e2e` scenario in `acceptance.feature` is implemented; every `@unit` and `@integration` scenario ID maps to an executable test; the phase-scoped mutation-testing run meets its configured threshold.

## Slice order

1. [Slice 01 - Package toolchain and verify gate](slice-01-package-toolchain.md)
2. [Slice 02 - Repository root resolution and fail-closed error contract](slice-02-repo-root-and-errors.md)
3. [Slice 03 - Frontmatter artifact reads](slice-03-frontmatter-artifact-reads.md)
4. [Slice 04 - Artifact layer integration and E2E verification (integration/E2E)](slice-04-artifact-layer-integration.md)
