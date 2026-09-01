# Artifacts And Lifecycle

Each artifact has one owner and one purpose. Keeping those boundaries intact prevents stale duplicated truth.

## Token And Change Economy

The workflow keeps context and diffs small by treating artifacts as references, not payloads to replicate:

- Load only the artifacts required for the current handoff, once per cycle, and reuse unchanged content.
- The orchestrator passes the slice and active phase invariants verbatim; the engineer reads scoped repository context only as needed.
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
| `docs/plans/phases/phase-XX/slice-XX-<slug>.md` | `work-planner` | Self-contained behavior, verification-only, or refactor execution brief |
| `AGENTS.md` | `agent-instructions` | Stable repository-wide coding guidance |
| `docs/adr/NNNN-<slug>.md` | `adr-writer` | Point-in-time record of a hard-to-reverse technical decision, gated from within `prd-writer`/`work-planner` |
| `.github/review-gate/decision-journal.jsonl` | Developer | Append-only, per-Finding Review Gate dispositions; Adopt Rule and Fix records the created Rule path |
| `.github/review-gate/rules/<rule-id>.md` | Developer | Repository-wide active Rule adopted through a Review Gate decision |
| `.github/hooks/review-gate.json` and `.github/review-gate/runtime/hooks/` | Review Gate | Deterministic Rule loading and citation enforcement for custom Review Subagent sessions |
| `test/review-gate/` | Developer | External validation suite for Review Gate behavior; it imports the packaged runtime under `.github/review-gate/runtime/` and exercises repository-level behavior without shipping test fixtures inside `.github/` |

Derive `<artifact-slug>` from the canonical project, product, or system name in `UBIQUITOUS-LANGUAGE.md`. If the glossary does not settle a name, use the product name in `CONTEXT.md`; if neither source settles it, ask before writing artifacts.

## Status Rules

- Valid phase and slice statuses are `planned`, `in progress`, and `completed`.
- Normally one phase is `in progress`.
- Status is recorded only in the main plan.
- Phase and slice detail documents retain durable content; they do not become status logs.
- Completed phase and slice artifacts remain in place.
- Retained completed slices created before slice kinds were introduced may omit that field; every new, revised, planned, or in-progress slice declares `behavior`, `verification-only`, or `refactor`.
- Only the current in-progress phase receives new slice files unless explicitly directed. `work-planner` writes them, and `Orchestrator` may expand the next phase's slices from an approved phase document at a phase boundary.
- The final slice of each phase is `verification-only` integration or end-to-end validation and introduces no production behavior. When the user has enabled mutation testing, that slice's verification commands also include the agreed mutation run per [`mutation-testing/references/PROTOCOL.md`](../.github/skills/mutation-testing/references/PROTOCOL.md).

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
- A hard-to-reverse, surprising, real-trade-off decision is recorded once through `adr-writer`, gated from within `prd-writer` (target architecture) or `work-planner` (sequencing/implementation architecture). An ADR is never edited in place; a new one supersedes it.

Never use a plan status field to sneak a product decision into the implementation record.

## Review Gate Decisions

The Decision Journal is JSON Lines: each line is one immutable decision for one
numbered Finding. `Fix Once`, `Adopt Rule and Fix`, and `Dismiss` are recorded
as `fix-once`, `adopt-rule-and-fix`, and `dismiss`. A dismissal remains limited
to its Finding and is not a Rule or future-match suppression mechanism.

An Adopt Rule and Fix decision creates a complete active Markdown Rule under
`.github/review-gate/rules/` before its decision is appended. Its journal record
stores that Rule's repository-relative path.

Findings remain review state, not durable plan status: each is resolved only by
its own recorded Developer disposition. Fix Once and Adopt Rule and Fix create
focused Engineer revision work and require a new Review Subagent report. Only
a final `No Findings` report permits Orchestrator to mark the slice completed.
