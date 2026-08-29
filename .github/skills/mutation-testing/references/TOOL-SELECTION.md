# Mutation Tool Selection

There is no default tool and no per-stack adapter in this repository. The user chooses; this file supplies the questions and the capability bar so the choice is informed rather than arbitrary.

## Ask Before Proposing

1. Which project or module should be measured first?
2. What is an acceptable run time for one mutation run — minutes, or overnight?
3. Is there an existing tool preference, a licence constraint, or a CI constraint?
4. Should the run block, or only report, at first? (Protocol default: report only.)

Then present the realistic candidates for the detected language, each with its trade-off (maturity, run time, incremental-run support, reporting format, licence). Discover candidates from the ecosystem's own package registry or documentation at the time of the request rather than a hardcoded list here, which would go stale and would read as a recommendation.

Let the user pick. If they name a tool this file has never heard of, that is fine — the requirements below are what matter, not the name.

## Capability Bar

Whatever the tool, its configuration must be able to express:

| Requirement | Why |
| --- | --- |
| Restrict the killing test set to unit tests | Integration and end-to-end tests are too slow and too coarse to be mutant killers |
| Restrict mutated source to a subset (project, path, or diff) | Incremental, phase-scoped runs keep cost proportional |
| Emit a mutation score and an itemized survivor list | Survivors are the actionable output; the score alone is not |
| Configure or disable a failure threshold | The first cycle must be able to run measure-only |

If the chosen tool cannot express one of these, say so plainly and record how the gap is handled (for example, scoping by test project selection instead of by trait). Do not pretend the constraint is satisfied.

## Configuration Rules

- One configuration file at the repository root is the source of truth for scope, thresholds, and exclusions.
- Record why each exclusion exists next to the exclusion.
- Config changes are their own commit, never mixed with behavior changes.
- Re-check the capability bar when upgrading or replacing the tool.
