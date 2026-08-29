# Slice Format

Purpose: define the retained slice detail document at `docs/plans/phases/phase-01/slice-01-<slug>.md`.

A slice is the payload the `orchestrator` agent turns into a brief for an engineer governed by `.github/agents/engineer.agent.md`. The orchestrator copies slice content verbatim and adds only the phase's cross-slice invariants, so the slice must stand alone: a subagent given only this content plus the repo must be able to work to completion without asking for missing intent.

The orchestrator gates dispatch on the user-visible outcome, files in scope, verification commands, and acceptance checks. A slice missing any of these is returned to `work-planner` instead of being executed.

## Sizing

- one slice is one vertical behavior, thin through every layer it touches
- the final slice of every phase is an integration and/or end-to-end slice that proves the phase's vertical behavior works as intended
- if a slice needs more than one vertical behavior to be useful, the phase is shaped wrong; resplit the phase rather than growing the slice
- if a slice cannot state a verification command, it is not ready to dispatch

## Include Always

- execution-ready slice detail
- success criteria strong enough for a subagent to loop independently
- every verification command needed to prove the slice
- the files or modules in scope

## Verification Commands

- state the focused test command the repository actually uses; never name a test framework or mocking library, since the test stack is discovered rather than prescribed
- add an integration verification command when the slice adds or changes a dependency boundary (network, database, filesystem, queue, external service, or process boundary)
- add a mutation-testing command only when the user has enabled mutation testing and its agreed cadence names this slice
- every listed command is run as written and must pass before the slice completes

## Rules

- keep slices concise and execution-ready
- state success as something runnable, not as a description of intent
- name the scope boundary so the subagent makes isolated changes
- carry no status field; the main plan is the single status record
- do not restate phase-level invariants; link to the phase document instead
- retain completed slice documents as planning baseline after the phase completes
- keep only the fields that are still useful for the slice state
- `Outcome` is written once, on completion, and overwritten rather than appended to; it is not a running log
- omit `Outcome` when the slice completed exactly as briefed with nothing worth recording

## Slice Detail Schema

- user-visible outcome
- backend/data slice
- UI/workflow slice
- files/modules in scope
- verification commands
- acceptance checks, stated as observable or testable results
- useful-if-stopped statement
- outcome, only if the completed slice deviated from the brief (scope change, discovery, follow-up needed)

## Skeleton

```md
# Slice 01 - <name>

- **User-visible outcome:** ...
- **Backend/data slice:** ...
- **UI/workflow slice:** ...
- **Files/modules in scope:** ...
- **Verification commands:** `...`
- **Acceptance checks:** ...
- **Useful-if-stopped statement:** ...
- **Outcome:** ... (only if the completed slice deviated from this brief)
```
