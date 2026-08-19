# PRD Format

Purpose: a compact target-state specification that extends `CONTEXT.md` and gives `work-planner` enough durable input to sequence work without reopening discovery. It describes what the product and repo should look like once v1 coding is done, never where they are now.

## Include Always
- target outcome
- requirements and behaviors
- scope refinements and non-goals not already in context
- target architecture direction and hard constraints
- acceptance signals
- planner assumptions

## Include Only When Needed
- open decisions that still block finalization or require explicit follow-up

## Exclude
- repo maturity, implemented/in-progress/absent areas, readiness, or any current-state assessment
- phase plans, slices, and implementation task lists
- user-story backlogs
- restatement of problem, users, workflow, scope guardrails, or glossary entries already in `CONTEXT.md`
- speculative architecture detail beyond the target direction and constraints
- amendment history or stale superseded discussion

## Rules
- reference `CONTEXT.md` as the canonical domain artifact and link rather than duplicate
- state the target in the present tense of the finished system
- write current truth only
- keep sections compact and bullet-first
- organize requirements by workflow or capability area
- use capability/behavior bullets, not story format
- assumptions must be safe for `work-planner` to treat as settled
- keep architecture direction at the level of boundaries, layers, and fixed platform choices
- omit `Open decisions` entirely when empty

## Change Discipline
Update this document only when the target changes:
- a required behavior is added, changed, or removed
- a scope boundary or non-goal moves
- a hard constraint or target architecture direction changes

Do not update it for progress, sequencing, status, or implementation discoveries. Route domain, user, workflow, or vocabulary changes back to `brain-storm`.

## Planner Assumptions
Include only assumptions or decisions that `work-planner` can safely rely on without reopening discussion, such as:
- settled scope boundaries
- settled platform or stack constraints
- settled operating model assumptions
- settled sequencing-shaping decisions

Do not include tentative guesses.

## Skeleton

```md
# Product Requirements Document

## Relationship To Context
- `CONTEXT.md` remains the canonical domain-language artifact for problem, users, workflow, and vocabulary.
- This document defines the target state to build; it does not describe current repo state.

## Target Outcome
- once v1 coding is done, ...
- once v1 coding is done, ...

## Requirements And Behaviors

### <Capability Or Workflow Area>
- the product must ...
- the product must ...

### <Capability Or Workflow Area>
- the product must ...
- the product must ...

## Scope Refinements And Non-Goals
- refinement beyond the context guardrails:
- out:
- deferred:

## Target Architecture And Constraints
- target architecture direction:
- required boundaries or layers:
- fixed platform or stack constraint:
- other hard constraint:

## Acceptance Signals
- the target is met when ...
- the target is met when ...

## Planner Assumptions
- `work-planner` may assume ...
- `work-planner` may assume ...

## Open Decisions
- unresolved decision:
- why it blocks or matters:
```

## Quality Bar
- `work-planner` should be able to derive the gap between repo reality and this target using this file plus `CONTEXT.md`
- a human operator should be able to see what is settled versus what remains open
- nothing in this file should need editing because code was written or a phase completed
