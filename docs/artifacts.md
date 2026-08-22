# Artifacts And Lifecycle

Each artifact has one owner and one purpose. Keeping those boundaries intact prevents stale duplicated truth.

## Token And Change Economy

The workflow keeps context and diffs small by treating artifacts as references, not payloads to replicate:

- Load only the artifacts required for the current handoff, once per cycle, and reuse unchanged content.
- The orchestrator passes the slice and active phase invariants verbatim; the coding agent reads scoped repository context only as needed.
- Update only the owning artifact. Prefer a status or single outcome-line change over rewriting durable content.
- Keep chat handoffs disposable and concise; durable detail belongs in its canonical artifact.

## Canonical Artifacts

| Artifact | Owner | Purpose |
| --- | --- | --- |
| `CONTEXT.md` | `brain-storm` | Problem, users, workflow, scope, constraints, and success |
| `UBIQUITOUS-LANGUAGE.md` | `brain-storm` | Canonical domain terms and banned synonyms |
| `docs/prd/<artifact-slug>-prd.md` | `prd-writer` | Stable v1 target state and acceptance signals |
| `docs/plans/<artifact-slug>-implementation-plan.md` | `work-planner` and `Orchestrator` | Routing table, current-state gap, and the only status record |
| `docs/plans/phases/phase-XX/phase.md` | `work-planner` | Cross-slice invariants and phase detail |
| `docs/plans/phases/phase-XX/slice-XX-<slug>.md` | `work-planner` | Self-contained execution brief for one vertical behavior |
| `AGENTS.md` | `agent-instructions` | Stable repository-wide coding guidance |

Derive `<artifact-slug>` from the canonical project, product, or system name in `UBIQUITOUS-LANGUAGE.md`. If the glossary does not settle a name, use the product name in `CONTEXT.md`; if neither source settles it, ask before writing artifacts.

## Status Rules

- Valid phase and slice statuses are `planned`, `in progress`, and `completed`.
- Normally one phase is `in progress`.
- Status is recorded only in the main plan.
- Phase and slice detail documents retain durable content; they do not become status logs.
- Completed phase and slice artifacts remain in place.
- Only the current in-progress phase receives new slice files unless explicitly directed.
- The final slice of each phase is integration or end-to-end validation.

## Plan Shape

```text
docs/plans/
  <artifact-slug>-implementation-plan.md
  phases/
    phase-01/
      phase.md
      slice-01-<slug>.md
```

Use zero-padded numbering and relative links. The main plan links to phase detail; phase detail links to slices. Do not duplicate fields across these files.

## Updating Truth

- Product discovery changes update context and glossary through `brain-storm`.
- Target behavior or architecture changes update the PRD through `prd-writer`.
- Implementation discoveries, sequencing, and status update plans through `work-planner` or `Orchestrator` according to the workflow.
- Stable repository conventions update `AGENTS.md` through `agent-instructions`.

Never use a plan status field to sneak a product decision into the implementation record.