# CONTEXT.md Format

Purpose: compact domain context for later AI planning, with ubiquitous-language summary that points to the companion glossary.

## Include Only
- problem
- primary user
- primary workflow
- v1 scope guardrails
- success signal
- compact ubiquitous-language summary needed for planning and naming

## Exclude
- architecture
- stack
- UI copy
- speculative future scope
- implementation tasks

## Rules
- bullet-first; no narrative
- each term gets 1 line when possible
- keep `CONTEXT.md` compact; store the expanded glossary in `UBIQUITOUS-LANGUAGE.md` beside it
- prefer canonical term + meaning + avoid-synonyms
- use only stable v1-shaping concepts
- if a term is unresolved, ask; do not invent
- prefer user vocabulary unless ambiguous
- merge synonyms; split only when rules or lifecycle differ
- ban generic drift terms like `item`, `thing`, `data`, `process`, `service` when a domain term exists

## Skeleton

```md
# Context

## Problem
- user pain
- desired outcome

## Users
- `Primary User` - who they are; why they care

## Workflow
- trigger
- key step
- key step
- successful outcome

## Ubiquitous Language
- See `UBIQUITOUS-LANGUAGE.md` for the canonical glossary.
- `Canonical Term` - short summary
- `Canonical Term` - short summary

## Scope Guardrails
- in: ...
- out: ...

## Success
- v1 succeeds when ...
```

## Quality Bar
- another skill should be able to plan from this file without reopening discovery
- another skill should know to read `UBIQUITOUS-LANGUAGE.md` when naming precision matters
- wording should make later phase names and code names obvious
- if a section does not change planning or naming, cut it
