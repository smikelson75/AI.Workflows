---
name: stryker-js
description: "Configure StrykerJS mutation testing for TypeScript/JavaScript, including Angular and React, scoped to unit tests, with a guided threshold walkthrough."
argument-hint: "Say 'baseline' for typical thresholds, or 'walkthrough' to set them with guidance"
user-invocable: true
disable-model-invocation: false
---

# StrykerJS Adapter

The TypeScript/JavaScript adapter for [`mutation-testing/protocol.md`](../mutation-testing/protocol.md). Load the protocol first; it owns cadence, test scope, blocking policy, repository maturity paths, and survivor remediation. This file supplies only what is specific to StrykerJS.

Owns one durable output in the target repository: `stryker.config.json` at the repository root, plus the mutation-testing verification command wired into each phase's final integration slice.

## Prerequisites

- `@stryker-mutator/core` installed as a dev dependency.
- A test runner plugin matching the repository's runner — see the table below. StrykerJS does not run tests itself.
- `@stryker-mutator/typescript-checker` for any TypeScript repository. Without it, mutants that do not type-check are reported as errors or survivors and the score is noise.
- At least one unit test suite covering the code to be mutated. If none exists, stop and hand off per the protocol's "mature codebase, no test suite" path.

| Repository runner | Plugin |
| --- | --- |
| Jest (typical React, CRA, Nx) | `@stryker-mutator/jest-runner` |
| Vitest (Vite, modern React) | `@stryker-mutator/vitest-runner` |
| Karma (Angular default) | `@stryker-mutator/karma-runner` |
| Mocha (Node libraries) | `@stryker-mutator/mocha-runner` |

Confirm the runner from the repository's own config, not from the framework name; Angular repositories are frequently migrated to Jest or Vitest.

## Scope Configuration

`mutate` targets files containing real logic. The framework does not change this rule, only which files qualify.

In scope by default:

- Services, stores, reducers, selectors, and the pure parts of effects.
- Guards, interceptors, resolvers, pipes, and custom hooks that branch.
- Validators, formatters, mappers, and domain models.

Excluded as thin wiring or generated code, with the reason recorded in `stryker.config.json`:

- `*.module.ts`, `main.ts`, `app.config.ts`, `environments/*`, barrel `index.ts` files.
- Generated API clients (OpenAPI, GraphQL codegen) and `*.stories.*`.
- Test files and test utilities.
- Purely presentational components with no branching.

Two mechanics decide how much of a UI codebase is reachable at all:

- **Angular HTML templates are never mutated.** StrykerJS mutates `.ts`/`.tsx` only. A condition living in a template is invisible to the score. Report that as an architecture-boundary signal per the protocol; do not treat template logic as covered.
- **JSX is partially mutated.** Expressions inside JSX — conditionals, `&&` shortcuts, string literals, boolean props — do produce mutants. Element structure does not. React components with real conditional rendering are therefore worth including.

If the qualifying `mutate` scope comes out near-empty because logic lives in components and templates, that is the protocol's architecture-boundary signal. Route the extraction work to `work-planner`; do not widen scope into end-to-end tests.

## Unit Boundary For This Stack

The protocol's "unit tests only" rule sits at a different place on the frontend than in a server stack. Apply it as:

- **In scope**: jsdom tests — Jest, Vitest, or Karma, with HTTP and browser boundaries mocked. A Testing Library component test counts as a unit test here; it is in-process, fast, and side-effect free even though it renders a tree.
- **Excluded**: Playwright, Cypress, Protractor, or anything driving a real browser or backend. A mutant that re-triggers a browser boot multiplies cost catastrophically.

## Incremental Scoping

- Use `--since <phase-start-ref>` together with `--incremental` (which caches per-mutant results in `reports/stryker-incremental.json`) to scope a phase's final integration slice run to that phase's diff.
- Set `coverageAnalysis: "perTest"` where the runner supports it; without it every mutant reruns the whole suite.
- For the one-time mature-repository baseline (the protocol's opt-in path), run without `--since` across the full configured `mutate` scope, and warn the user this can take significantly longer before starting.

## Guided Threshold Walkthrough

Ask one focused question at a time, offering a sensible default so the user can accept it in one word:

1. Did a full-repo baseline already run? If so, what score did it report? Use it as the anchor for `low`/`break`.
2. How critical is the code in scope (domain and business rules vs. generic utility)? Higher criticality pulls `high`/`break` upward.
3. Is this the first enabled phase (measure-only per the protocol), or has a backlog already been cleared (blocking allowed)?

Propose `high`, `low`, and `break` values from the answers and StrykerJS's typical default bands; confirm with the user before writing `stryker.config.json`. Do not silently pick values.

## Verification

Run and report:

- `npx stryker run` (scoped per the incremental/baseline rule above) — reports the mutation score and survived mutants.
- If `break` is set and the score falls below it, the command exits non-zero; treat that as any other failed verification per the protocol's survivor remediation rule.
- Report compile-error and timeout mutant counts separately from survivors. A large compile-error count usually means the TypeScript checker is missing or misconfigured, not that tests are weak.

## Exit Conditions

Done when `stryker.config.json` exists at the root with recorded runner, scope, and threshold decisions, the verification command has been run and reported, survivors have been routed per the protocol (fixed inline or handed to `work-planner`), and — if this was the first run on the repository — the repository maturity path taken has been stated in the exit brief.
