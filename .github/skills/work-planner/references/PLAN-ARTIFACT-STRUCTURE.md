# Plan Artifact Structure

Purpose: define the canonical file layout and naming rules for the `work-planner` skill so planning context stays small while completed detail remains durable.

## Canonical Files
- artifact slug: derive `<artifact-slug>` from the settled project or product name in `UBIQUITOUS-LANGUAGE.md`, falling back to `CONTEXT.md` only when the glossary has no project name
- main plan: `docs/plans/<artifact-slug>-implementation-plan.md`
- phase detail root: `docs/plans/phases/`
- phase detail document: `docs/plans/phases/phase-01/phase.md`
- slice detail document: `docs/plans/phases/phase-01/slice-01-<slug>.md`

## Naming Rules
- use zero-padded two-digit numbering for phases: `phase-01`, `phase-02`
- do not include a slug in the phase folder name
- name the phase detail file `phase.md`
- create slice files only inside the owning phase folder
- use zero-padded two-digit numbering for slices within a phase: `slice-01-<slug>.md`, `slice-02-<slug>.md`
- do not repeat the phase number in the slice filename
- use a short descriptive slug in slice filenames
- keep links relative whenever practical so the artifact set can move as a unit

## Planning Rules
- always write or update the main plan as the single entry document and the single status record
- always create or retain a separate phase detail document for each phase
- create slice detail documents only for the single `in progress` phase
- make the final slice of every phase an integration and/or end-to-end slice
- when a phase becomes `completed`, keep its phase document and slice documents; update statuses in the main plan rather than collapsing or deleting them
- link from the main plan to each phase document without restating its detail
- list slice links in each phase document without restating slice content

## Recommended Link Shape
- main plan to phase: `[Phase 01 detail](phases/phase-01/phase.md)`
- main plan to slice: `[Slice 01 detail](phases/phase-01/slice-01-<slug>.md)`
- phase to slice: `[Slice 01 - <name>](slice-01-<slug>.md)`

## Example Layout

```text
docs/plans/
  <artifact-slug>-implementation-plan.md
  phases/
    phase-01/
      phase.md
      slice-01-bootstrap-authentication.md
      slice-02-add-login-flow.md
    phase-02/
      phase.md
```

## Drift To Avoid
- do not keep full phase detail inline in the main plan
- do not record status anywhere except the main plan
- do not restate a phase or slice field in more than one artifact
- do not create slice files for planned future phases
- do not rename completed artifacts into archive-only names that hide their baseline value
- do not use mixed numbering widths such as `phase-1` or `slice-1-...`
- do not use `phase-01-<slug>` or `slice-01-01-<slug>`
