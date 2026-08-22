# Main Plan Format

Purpose: define the compact entry document at `docs/plans/<artifact-slug>-implementation-plan.md`, where `<artifact-slug>` is derived from the settled project or product name in `UBIQUITOUS-LANGUAGE.md` and falls back to `CONTEXT.md` only when the glossary has no project name.

The main plan is the orchestrator's routing table and the single record of status. It answers three questions without loading anything else: what is being built, what is done, and what to dispatch next. Everything else lives behind a link.

## Include Always

- problem and approach
- current-state summary and gap to the PRD target
- an active pointer naming the current phase and next slice
- a phase table with status and links
- a slice status list for the `in progress` phase only

## Rules

- this is the only artifact that records status; phase and slice documents carry none
- keep all phase detail out of the main plan; carry one line of intent per phase, no more
- never restate a field that exists in a phase or slice document
- the orchestrator updates status here and nowhere else, so a transition is a one-file write
- retire the slice status list when the phase completes, keeping the phase row and its link

## Phase Row Schema

- phase number and name
- status
- phase detail link
- one-line user-visible outcome

## Skeleton

```md
# <Project Name> implementation plan

## Problem and approach
- what is being built
- how delivery is shaped

## Current state and gap
- project type
- maturity
- architecture direction in place
- implemented areas
- in-progress areas
- absent areas required by the PRD target
- known constraints
- readiness
- assumptions

## Active work
- **Current phase:** [Phase N - <name>](phases/phase-01/phase.md)
- **Next slice:** [Slice 02 - <name>](phases/phase-01/slice-02-<slug>.md)
- **Blockers:** ...

## Phase plan

| # | Phase | Status | Outcome | Detail |
|---|-------|--------|---------|--------|
| 01 | <name> | completed | <one line> | [detail](phases/phase-01/phase.md) |
| 02 | <name> | in progress | <one line> | [detail](phases/phase-02/phase.md) |
| 03 | <name> | planned | <one line> | [detail](phases/phase-03/phase.md) |

## Slice status - Phase 02

| # | Slice | Status | Detail |
|---|-------|--------|--------|
| 01 | <name> | completed | [detail](phases/phase-02/slice-01-<slug>.md) |
| 02 | <name> | in progress | [detail](phases/phase-02/slice-02-<slug>.md) |
| 03 | <name> (integration/E2E) | planned | [detail](phases/phase-02/slice-03-<slug>.md) |
```
