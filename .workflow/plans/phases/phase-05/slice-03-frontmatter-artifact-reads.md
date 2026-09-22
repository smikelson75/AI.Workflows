# Slice 03 - Frontmatter artifact reads

- **User-visible outcome:** A caller naming a phase or slice inside a resolved `Repository Root` receives that artifact's machine-readable fields, parsed from YAML frontmatter, or a fail-closed error naming the artifact path and the offending field.
- **Backend/data slice:** Define the typed frontmatter contract for phase and slice artifacts, covering the machine-readable fields the deterministic verification workflow needs: slice identity, phase identity, slice kind (behavior or non-behavior), files in scope, unit and integration verification commands, and acceptance check identifiers. Derive the field set from the existing report schemas and fail-closed rules under `.github/skills/deterministic-verification/`. Implement the artifact layer functions that locate `.workflow/plans/phases/phase-NN/phase.md` and `slice-NN-*.md` relative to the resolved root, split frontmatter from the document body, parse the YAML, and validate it against the typed contract. Absent frontmatter, unparsable YAML, an unknown field, and a missing or wrongly-typed required field each fail closed. The document body is returned untouched and is never parsed for machine-readable fields.
- **UI/workflow slice:** None.
- **Files/modules in scope:** `packages/verification-mcp-server/src/artifacts/**`, `src/models/artifacts.ts`, `src/errors/registry.ts` (additive identifiers only), `test/artifacts/**`, `test/helpers/**`, `test/fixtures/**`. Do not add policy logic, MCP transport, or command-line entry points.
- **Verification command:**
  - static: `npm --prefix packages/verification-mcp-server run verify`
  - unit: `npm --prefix packages/verification-mcp-server test`
- **Acceptance checks:**
  - A well-formed fixture phase artifact and slice artifact each return their declared fields with correct types.
  - The returned result exposes the document body unchanged, and no machine-readable field is derived from body text.
  - An artifact with no frontmatter block fails with a stable identifier naming the artifact path.
  - An artifact with unparsable YAML fails with its own stable identifier naming the artifact path.
  - An artifact missing a required field, and one carrying an unknown field, each fail with a stable identifier naming both the artifact path and the field.
  - A named phase or slice that does not exist on disk fails with its own stable identifier.
  - Artifact paths resolve relative to the supplied `Repository Root` and work identically with Windows and POSIX separators.
  - Every new identifier is added to the registry, and the registry test still passes with no duplicates or unused entries.
- **Useful-if-stopped statement:** Workflow artifacts become deterministically machine-readable, which is the precondition for every policy decision in Phases 06 through 08 and the durable half of the ADR 0003 cutover.
