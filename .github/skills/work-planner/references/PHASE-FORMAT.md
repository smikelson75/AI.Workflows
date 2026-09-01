# Phase Format

Purpose: define the retained phase detail document at `docs/plans/phases/phase-01/phase.md`.

The phase document exists to hold what no single slice can own: the objective, the boundaries, and the invariants that hold across every slice in the phase. The orchestrator loads it once per phase to keep slice briefs consistent. It is not a summary of its slices.

## Include Always

- phase objective
- phase-level scope and acceptance detail
- cross-slice invariants and boundaries
- an ordered list of slice links, only when this is the `in progress` phase and slice planning exists

## Rules

- keep planned and completed phase documents detailed enough to preserve planning baseline
- carry no status field; the main plan is the single status record
- list slices as ordered links only; never restate slice content, outcomes, or acceptance checks here
- the last slice in the list is always the `verification-only` integration and/or end-to-end slice for the phase
- do not create slice lists for future planned phases unless the user explicitly directs otherwise
- keep only the fields that are still useful for the phase state

## Phase Detail Schema

- phase objective
- user-visible outcome
- backend/data scope
- UI/workflow scope
- cross-slice invariants
- prerequisites
- blockers
- acceptance checks
- useful-if-stopped statement
- risks and mitigations
- test checkpoints
- definition of done
- ordered slice links, if this is the `in progress` phase and slice planning exists

## Skeleton

```md
# Phase N - <name>

- **Phase objective:** ...
- **User-visible outcome:** ...
- **Backend/data scope:** ...
- **UI/workflow scope:** ...
- **Cross-slice invariants:** ...
- **Prerequisites:** ...
- **Blockers:** ...
- **Acceptance checks:** ...
- **Useful-if-stopped statement:** ...
- **Risks and mitigations:** ...
- **Test checkpoints:** ...
- **Definition of done:** ...

## Slice order

1. [Slice 01 - <name>](slice-01-<slug>.md)
2. [Slice 02 - <name>](slice-02-<slug>.md)
3. [Slice 03 - <name> (integration/E2E)](slice-03-<slug>.md)
```
