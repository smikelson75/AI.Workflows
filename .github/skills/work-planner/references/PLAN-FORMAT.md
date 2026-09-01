# Plan Format

Purpose: a living implementation plan set that carries current repo state and sequences work toward the target defined by `CONTEXT.md` and `docs/prd/<artifact-slug>-prd.md`. It keeps the main plan compact, stores full phase detail in separate phase documents, and carries slice detail only for the current in-progress phase.

The artifact set serves the `orchestrator` agent, which dispatches engineers governed by `.github/agents/engineer.agent.md`. The main plan routes, the phase document constrains, the slice document is dispatched.

## Include Always
- main plan: problem and approach
- main plan: current-state summary and gap to the PRD target
- main plan: active pointer, phase table, and all statuses
- phase detail document for each phase

## Exclude
- any status outside the main plan
- any field restated in more than one artifact
- amendment discussion or proposal sections once direction is approved
- detailed slices for future planned phases
- full phase detail inline in the main plan
- code task lists outside active phase slices
- immediate start or next-step sections outside active phase slices
- `Step` terminology

## Rules
- write current truth only
- plan artifacts absorb implementation reality; never edit `CONTEXT.md` or the PRD to record progress or discoveries
- use `Slice`, never `Step`
- keep the main plan compact and phase-oriented
- record every status in the main plan only, so a status transition is a one-file write
- keep full phase detail in `docs/plans/phases/phase-01/phase.md` style documents
- only one `in progress` phase should normally carry slices
- retain completed phase and slice artifacts instead of collapsing or deleting them
- future phases must be detailed enough to support later slice generation
- link from the main plan to each phase document
- link from a phase document to its slice documents, without restating their content
- omit empty fields rather than preserving noise

## Statuses
Status is recorded only in the main plan.
- phase: `planned`, `in progress`, `completed`
- slice: `planned`, `in progress`, `completed`

## Artifact Layout
- artifact slug: derive `<artifact-slug>` from the settled project or product name in `UBIQUITOUS-LANGUAGE.md`, falling back to `CONTEXT.md` only when the glossary has no project name
- main plan: `docs/plans/<artifact-slug>-implementation-plan.md`
- phase detail document: `docs/plans/phases/phase-01/phase.md`
- slice detail document: `docs/plans/phases/phase-01/slice-01-<slug>.md`

Use zero-padded numbering. Do not include a slug in the phase folder name. Do not repeat the phase number in the slice filename.

## Artifact-Specific References
- main plan format: [MAIN-PLAN-FORMAT.md](MAIN-PLAN-FORMAT.md)
- phase detail format: [PHASE-FORMAT.md](PHASE-FORMAT.md)
- slice detail format: [SLICE-FORMAT.md](SLICE-FORMAT.md)

## Slice Rules
- slices are allowed only under the single current `in progress` phase unless the user explicitly directs otherwise
- every slice declares exactly one kind: `behavior`, `verification-only`, or `refactor`
- one `behavior` slice is one vertical behavior
- the final slice of every phase is a `verification-only` integration and/or end-to-end slice proving behavior implemented by earlier slices
- a slice must be self-contained enough to become a subagent brief, including a verification command and files in scope
- completed slice documents are retained as planning baseline after the phase completes

## Quality Bar
- the orchestrator can pick the next unit of work from the main plan alone
- a slice document can be dispatched to a coding subagent without loading the main plan or the phase document
- the main plan should stay compact as phases complete
- completed artifacts should remain available as planning baseline for later updates
- later slice generation should be possible from phase-level content alone for non-active phases
