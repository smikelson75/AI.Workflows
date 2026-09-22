# 0003. YAML Frontmatter on Phase and Slice Artifacts, Migrated by Hand

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

Phase and slice artifacts under `.workflow/plans/` are prose documents. The `Verification MCP Server` must derive workflow position, verification commands, and acceptance checks from those artifacts on every call, and it must do so deterministically. Parsing prose to recover machine-readable fields is brittle: heading text, bullet wording, and formatting drift silently change what the server reads, and a wrong read produces a confidently wrong `Next Action`.

Existing repositories already carry artifacts in the prose-only shape, so the format change also forced a decision about migration.

## Decision

1. Require YAML frontmatter on phase and slice artifacts carrying all machine-readable fields, with prose retained in the document body for human readers.
2. Make the server read machine-readable fields exclusively from frontmatter, never from prose.
3. Treat missing or malformed frontmatter as a fail-closed error naming the artifact and field.
4. Migrate existing artifacts by hand and have future repositories re-onboard; ship no automated migration tooling.

## Alternatives Considered

- **Continue parsing prose with conventions and heuristics**: Rejected because the parse silently misreads on formatting drift, and a silent misread is worse than a hard failure in a fail-closed system.
- **Move machine-readable fields into separate sidecar JSON files**: Rejected because the machine fields and the prose that explains them would drift apart across two files, and every artifact edit would become a two-file edit.
- **Make frontmatter optional with prose fallback**: Rejected because a fallback path reintroduces the brittle parser and makes failures probabilistic rather than deterministic.
- **Build an automated migration tool for legacy artifacts**: Rejected because the affected artifact count is small and bounded, while a migrator would need to solve the same prose-parsing problem this decision exists to eliminate.

## Consequences

- Workflow position, verification commands, and acceptance checks become deterministic reads with explicit failure when absent.
- Artifact authoring gains a schema obligation: every phase and slice document must carry valid frontmatter or it blocks.
- Existing plan artifacts require manual upgrade before the server can operate on them, and that work has no tooling to lean on.
- Repositories already using the prose-only shape must re-onboard rather than upgrade incrementally.
