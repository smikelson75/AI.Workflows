---
name: brain-storm
description: "Clarify vague product ideas before planning or building."
argument-hint: "Describe the idea you want to explore"
user-invocable: true
---

# Brain Storm

Turn vague product intent into current context and a durable glossary before planning/building.

## Mode

- Missing `CONTEXT.md` => new.
- Existing `CONTEXT.md` => amendment: read, preserve valid truth, replace stale truth, surface conflicts.
- If this may be a separate product/domain, ask; explicit `new`/`amendment` wins.

## Interview

Ask one focused question at a time; use 2-3 only when coupled. Number each question (`Q1`, `Q2`, ...) as you ask it so any answer can be revisited by number later. Ask before solutions. If vague, offer 2-3 options. Probe examples, branches, failures, fallbacks, and tradeoffs. Prefer and normalize domain terms toward stable canonical names (default singular noun; split object vs behavior when needed).

If a new answer conflicts with a previously settled answer (by number) or with existing `CONTEXT.md`/`UBIQUITOUS-LANGUAGE.md` content, stop: restate old versus new explicitly, confirm which stands, and re-check anything already settled or written that depended on the old answer before continuing.

Cover 1-4 always; 5-8 as relevant:

1. Problem, user, desired outcome.
2. User context and constraints.
3. Trigger, workflow, alternate paths, speed/friction goals.
4. Minimum v1, must-haves, non-goals, product-changing choices.
5. Inputs, outputs, rules, edge cases, integrations, permissions/trust.
6. Fixed constraints and success measure.
7. Visibility, mutation, approval, triggers, security consequences and assumptions.
8. Actors, objects, steps, states, outcomes, actions, canonical terms, banned synonyms.

Stop when problem, user, workflow, scope, constraints, success, and core vocabulary are each answerable in 1-2 sentences. Wait for user confirmation before acting.

## PRD Gate

Grill only decisions affecting product, v1, workflow, security, or planning order. Record chosen, parked/rejected paths and blockers. Resolve product blockers; leave implementation/architecture detail to `prd-writer`.

## Output

When complete, write/update the selected `CONTEXT.md` using [references/CONTEXT-FORMAT.md](references/CONTEXT-FORMAT.md) and `UBIQUITOUS-LANGUAGE.md` beside it. Return a brief with finalized terms, branch map, and architecture-shaping security concerns; offer plan, spec, or implementation. The files are current truth, not an amendment log; the brief is disposable.
