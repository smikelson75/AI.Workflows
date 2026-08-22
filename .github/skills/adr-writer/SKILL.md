---
name: adr-writer
description: "Record an architecture or technical decision as an ADR when it is hard to reverse, would surprise a future reader without context, and reflects a real trade-off among alternatives."
argument-hint: "Describe the decision and the alternatives considered."
user-invocable: true
---

# ADR Writer

Record durable technical/architecture decisions surfaced by `prd-writer`, `work-planner`, or ad hoc implementation work. An ADR is a point-in-time record of why a decision was made, not a living document.

## When To Write One

Write an ADR only when all three hold:

1. **Hard to reverse**: the cost of changing course later is meaningful.
2. **Surprising without context**: a future reader would wonder why it was done this way.
3. **Real trade-off**: genuine alternatives existed and one was chosen over the others for specific reasons.

If any is missing, skip it. Routine or easily-reversed choices do not get an ADR.

## Contract

- Distinct from `CONTEXT.md`: `CONTEXT.md` is domain/business vocabulary and is corrected in place as understanding sharpens. An ADR is a technical/architecture decision and is never rewritten in place.
- ADRs are point-in-time. Never edit an accepted ADR's body to reflect new understanding; write a new ADR that supersedes it.
- Lazy creation: do not create `docs/adr/` or a numbered file until a real decision needs recording.
- Keep it short: context, decision, alternatives considered and why rejected, consequences.

## Naming

- Path: `docs/adr/NNNN-<slug>.md`, zero-padded sequential numbering starting at `0001`.
- `<slug>` is a short kebab-case description of the decision.

## Read Order

1. Existing `docs/adr/` entries, to continue numbering and avoid a duplicate or contradicting decision.
2. The PRD and/or plan artifact that surfaced the decision, for context.

## Workflow

1. Confirm the three-part test holds; if not, say so and stop without writing.
2. Identify the alternatives genuinely considered and why each was rejected.
3. Write `docs/adr/NNNN-<slug>.md` using [references/ADR-FORMAT.md](references/ADR-FORMAT.md).
4. If this decision reverses an earlier ADR, add a `Superseded by` note to the old file's status line and reference it from the new one. Do not delete or rewrite the old file's body.

## Exit

Return a one-line pointer to the new ADR file and a short statement of the decision. The ADR file is the durable artifact; the chat summary is disposable.
