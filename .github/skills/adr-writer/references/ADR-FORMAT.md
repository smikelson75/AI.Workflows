# ADR Format

Purpose: a point-in-time record of a hard-to-reverse technical decision, so a future reader knows why, not just what.

## Include Always

- status (`Accepted` or `Superseded by NNNN`)
- context: the problem forcing a decision
- decision: what was chosen, stated plainly
- alternatives considered and why each was rejected
- consequences: what becomes easier or harder as a result

## Exclude

- domain vocabulary or business rules; that belongs in `CONTEXT.md`/`UBIQUITOUS-LANGUAGE.md`
- implementation task lists, sequencing, or status content; that belongs in plan artifacts
- speculative future decisions not yet made

## Rules

- number sequentially, zero-padded: `0001`, `0002`, ...
- one decision per file
- never edit an accepted ADR's body to reflect new understanding; supersede it with a new numbered file instead
- keep it short: a good ADR fits on one screen

## Skeleton

```md
# NNNN. <Decision Title>

Status: Accepted <!-- or: Superseded by 000X -->

## Context
- what forced this decision

## Decision
- what was chosen, stated plainly

## Alternatives Considered
- `Alternative` - why rejected
- `Alternative` - why rejected

## Consequences
- what becomes easier
- what becomes harder or constrained
```

## Quality Bar

- a future reader unfamiliar with the discussion understands why, not just what
- nothing here needs editing because code changed later; a new decision gets a new ADR
