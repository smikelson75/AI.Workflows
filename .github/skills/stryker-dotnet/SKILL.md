---
name: stryker-dotnet
description: "Configure Stryker.NET mutation testing for C#/.NET, scoped to unit tests, with a guided threshold walkthrough."
argument-hint: "Say 'baseline' for typical thresholds, or 'walkthrough' to set them with guidance"
user-invocable: true
disable-model-invocation: false
---

# Stryker.NET Adapter

The C#/.NET adapter for [`mutation-testing/protocol.md`](../mutation-testing/protocol.md). Load the protocol first; it owns cadence, test scope, blocking policy, repository maturity paths, and survivor remediation. This file supplies only what is specific to Stryker.NET.

Owns one durable output in the target repository: `stryker-config.json` at the repository root, plus the mutation-testing verification command wired into each phase's final integration slice.

## Prerequisites

- `dotnet-stryker` tool installed (`dotnet tool install -g dotnet-stryker`, or as a local tool manifest entry).
- At least one unit test project referencing the code to be mutated. If none exists, stop and hand off per the protocol's "mature codebase, no test suite" path.

## Scope Configuration

- `mutate`: source projects containing real logic — typically `Domain`/`Application` in a layered solution. Exclude `Storage.*`, `Api`, `Console`, and any other thin-wiring project by default.
- Test runner scope: unit test project(s) only. Exclude integration/e2e test projects from Stryker's test discovery entirely, or exclude by trait (for example `[Trait("Category","Integration")]`) if they share a project with unit tests.
- Record the excluded projects and the reason (thin wiring, or integration/e2e) as comments in `stryker-config.json`.

## Incremental Scoping

- Use `--since:<phase-start-ref>` (or the config `baseline`/`since` equivalent) to scope a phase's final integration slice run to that phase's diff.
- For the one-time mature-repository baseline (the protocol's opt-in path), run without `--since`, across the full configured `mutate` scope, and warn the user this can take significantly longer before starting.

## Guided Threshold Walkthrough

Ask one focused question at a time, offering a sensible default so the user can accept it in one word:

1. Did a full-repo baseline already run? If so, what score did it report? Use it as the anchor for `low`/`break`.
2. How critical is the code in scope (domain/business rules vs. generic utility)? Higher criticality pulls `high`/`break` upward.
3. Is this the first enabled phase (measure-only per the protocol), or has a backlog already been cleared (blocking allowed)?

Propose `high`, `low`, and `break` values from the answers and Stryker's typical default bands; confirm with the user before writing `stryker-config.json`. Do not silently pick values.

## Verification

Run and report:

- `dotnet stryker` (scoped per the incremental/baseline rule above) — reports the mutation score and survived mutants.
- If `break` is set and the score falls below it, the command fails; treat that as any other failed verification per the protocol's survivor remediation rule.

## Exit Conditions

Done when `stryker-config.json` exists at the root with recorded scope/threshold decisions, the verification command has been run and reported, survivors have been routed per the protocol (fixed inline or handed to `work-planner`), and — if this was the first run on the repository — the repository maturity path taken has been stated in the exit brief.
