# Phase Acceptance Gherkin Format

Purpose: define the human-reviewable acceptance contract at `docs/plans/phases/phase-XX/acceptance.feature`.

## Required Shape

```gherkin
# Sources:
# - ../../../prd/<artifact-slug>-prd.md
# - phase.md

Feature: <phase user-visible capability>
  <One short statement of user value and the observable boundary.>

  @qa-p01-001 @e2e
  Scenario: <observable behavior>
    Given <user-visible precondition>
    When <user action or external event>
    Then <observable result>
```

## Rules

- Use one feature file per phase.
- Give each scenario a stable, phase-scoped ID tag: `@qa-pXX-NNN`.
- Give each scenario exactly one verification-level tag: `@unit`, `@integration`, or `@e2e`.
- Describe behavior and outcomes, not selectors, methods, classes, database tables, transport calls, or test-framework mechanics.
- Keep `Given` clauses to externally meaningful state, `When` clauses to one action or event, and `Then` clauses to observable outcomes.
- Use `Background` only for a prerequisite shared by most scenarios.
- Use `Scenario Outline` only when examples represent materially distinct acceptance cases.
- Preserve scenario IDs during revisions. Add new IDs rather than renumbering existing scenarios.
- Keep source references in comments and do not duplicate requirement prose.

## Coverage Levels

- `@unit`: a rule can be proven at an isolated logic boundary without assembled dependencies.
- `@integration`: behavior crosses a process, service, persistence, messaging, or external-system boundary but does not require the complete user workflow.
- `@e2e`: behavior proves a critical user journey across the assembled system through a public interface.

The verification-level tag selects the cheapest test boundary that proves the behavior. Gherkin does not make every scenario an E2E test.

## Exceptions

An approved non-automated scenario uses `@exception` in addition to its verification-level tag and records the reason immediately above it:

```gherkin
# Exception: <specific constraint and why deterministic automation is not currently possible>
@qa-p01-004 @e2e @exception
Scenario: <observable behavior>
```

Exceptions require QA revision and renewed human approval. Temporary implementation inconvenience is not an exception.

## Traceability

Executable tests use the stable scenario ID in their test name, display name, trait, tag, or nearest framework-supported metadata. During the final integration/E2E slice, `Engineer`:

- implements all non-excepted `@e2e` scenarios;
- confirms `@unit` and `@integration` IDs map to executable tests;
- reports any missing mapping as a failed acceptance check;
- routes proposed exceptions back through `qa-design` and human approval.