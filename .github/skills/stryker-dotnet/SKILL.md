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

Propose `high`, `low`, and `break` values from the answers and Stryker's typical default bands; confirm with the user before writing `stryker-config.json`. Do not silently pick values. If this is the first enabled phase (measure-only), omit `break` (or set `break: 0`) so the run measures and reports scores and survivors without failing the verification command; `break` is configured only after the survivor backlog is cleared.

## Run Completeness Signals

Apply the protocol's Run Completeness rules using these Stryker.NET-specific signals. Scan the run output for each before reporting a score.

### Safe Mode dropped an entire method

```
[WRN] An unidentified mutation in <file> resulted in a compile error (at L:C) with id: CS0165 ...
[INF] Safe Mode! Stryker will remove all mutations in <Method> and mark them as 'compile error'.
```

This is the highest-priority signal: every mutant in the named method is discarded, so the method contributes nothing to the score while appearing clean. Report each affected method by name.

Usual cause is a **code shape whose definite assignment depends on control flow Stryker mutates away**, not a bug. Two recurring C# shapes and their suggested fixes:

- `if (x is not T v || v.Value is null)` — mutating `||` to `&&` leaves `v` unassigned (`CS0165`). Suggest collapsing to a single always-assigned local, e.g. `var key = (x as T)?.Value ?? string.Empty;` followed by a guard on `key`.
- `if (x is not T v) { …; continue; }` followed by use of `v` — statement-removal of the `continue` falls through to an unassigned `v`. Suggest inverting to the positive pattern `if (x is T v) { … } else { …diagnostic… }`, extracting the body into a helper if nesting grows.

Where `TreatWarningsAsErrors` is enabled, reject any suggested fix that leaves a nullable-analysis warning; the mutant build inherits that setting and will fail the same way.

### Other incompleteness signals

- **Build failure** before mutation starts — the solution must build in the configured configuration first; report the build error, not a score.
- **`0x800711C7` / "An Application Control policy has blocked this file"** — Windows Smart App Control or WDAC blocked `Stryker.CLI.dll`. Confirm in the `Microsoft-Windows-CodeIntegrity/Operational` event log (events 3033/3077). Under Smart App Control this is typically a transient reputation lag on a freshly installed tool: retry once before escalating, and only then raise an allowlist decision with the user.
- **`Number of tests found: 0`** for a project in mutate scope — test discovery failed; the score for that project is meaningless.
- **No projects found to mutate**, or a mutate scope far smaller than the phase diff — check the `project`/`solution` and `mutate` settings in `stryker-config.json`.
- **Timeout mutants in volume** — report the count separately from survivors; it usually indicates a test-level deadlock or an unbounded loop mutant, not weak tests.

Report compile-error, timeout, and ignored mutant counts separately from survivors in every run summary.

## Verification

Run and report:

- `dotnet stryker` (scoped per the incremental/baseline rule above) — reports the mutation score and survived mutants.
- The completeness check above. A run with dropped methods, zero discovered tests, or an empty mutate scope has not passed, regardless of the reported score or a green `dotnet test`.
- If `break` is set and the score falls below it, the command fails; treat that as any other failed verification per the protocol's survivor remediation rule.
- On an unexplained failure, rerun with `dotnet stryker --verbosity trace --log-to-file` before escalating, and quote the specific error rather than the whole log.

## Exit Conditions

Done when `stryker-config.json` exists at the root with recorded scope/threshold decisions, the verification command has been run **to completion** and reported, any incompleteness was escalated to the user with named causes and proposed fixes and then resolved, survivors have been routed per the protocol (fixed inline or handed to `work-planner`), and — if this was the first run on the repository — the repository maturity path taken has been stated in the exit brief.
