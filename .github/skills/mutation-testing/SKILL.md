---
name: mutation-testing
description: "Set up and run mutation testing with the tool the user chooses, and wire its cadence into the plan."
argument-hint: "Ask to set up mutation testing, or to run it for the current phase"
user-invocable: true
---

# Mutation Testing

Opt-in. Mutation testing is never enabled automatically and never assumes a tool. This skill supplies the cadence, scope, and blocking rules that do not change between stacks, and adapts to whichever mutation-testing tool the user selects.

Load before acting:

- [references/PROTOCOL.md](references/PROTOCOL.md) — cadence, scope, blocking policy, maturity paths, survivor remediation
- [references/TOOL-SELECTION.md](references/TOOL-SELECTION.md) — how to choose a tool with the user, and what any chosen tool must be configured to do

## Two Modes

### Setup

Run once per repository, or when the choice changes.

1. Confirm the repository is a candidate at all: a real unit test suite must exist, or be planned, per the protocol's maturity paths.
2. Check `git status`. If the worktree is dirty, stop and ask the user to commit or isolate the pending changes first — mutation configuration is committed on its own.
3. Settle the tool with the user per `references/TOOL-SELECTION.md`. Present candidates and trade-offs; do not pick silently, and do not require a tool this repository has an adapter for — there are no adapters, only the user's choice.
4. Settle the cadence and the blocking policy with the user, defaulting to the protocol's recommendation (phase-final slice, incrementally scoped, measure-only on the first cycle).
5. Settle thresholds through a guided walkthrough. Ask about risk tolerance, existing suite strength, and acceptable run time, then propose values from the chosen tool's own bands and confirm before writing.
6. Write the chosen tool's configuration at the repository root, scoped per the protocol, with the scope and threshold decisions recorded as comments or documented alongside. Commit it on its own.
7. State the resulting verification command so `work-planner` can attach it to phase-final slices, and hand the user the text to pass to `/agent-instructions`.

### Run

1. Run the configured command with the agreed scope for the current phase.
2. Report the mutation score and the survivor list.
3. Route survivors per the protocol: inside the current slice's file scope, fix inline and rerun; outside it, or a large batch, escalate to `work-planner` as remediation slices.

## Boundaries

- Does not choose the tool, the thresholds, or the cadence unilaterally.
- Does not define how tests are written; that is `tdd`.
- Does not write `AGENTS.md`, plan artifacts, PRD, or context.
- Does not run inside the Red-Green-Refactor inner loop.
- Escalates to `adr-writer` only when the enforcement choice is hard to reverse and genuinely contested, such as blocking enforcement across a large legacy codebase or permanently excluding a layer from mutation scope.

## Exit

Done when the tool is chosen and configured (setup) or the run is reported and survivors routed (run), the decisions taken are stated, and the mutation verification command is named for the planner.
