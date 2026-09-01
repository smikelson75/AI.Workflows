# Test Stack Discovery

How to settle which testing packages and commands to use, without imposing a choice. Do this once per repository (or per project within it) before the first Red step, then reuse the answer.

## Order Of Authority

1. **Existing tests.** The strongest evidence. Read one or two representative test files and the nearest test project/config: framework import, assertion style, test-double approach, fixture and naming conventions.
2. **Manifests and config.** Dependency manifests, lock files, test runner config, and task/script definitions name the framework and usually the run commands.
3. **Repository instructions.** `AGENTS.md` or an equivalent instruction file may state the required stack and commands. Treat a contradiction with the code as a question, not a silent override.
4. **The user.** If none of the above settles it, ask. Present the realistic options for the detected language with their trade-offs and let the user pick. Do not pick for them, and do not fall back to "the popular one".

## What Must Be Settled

| Item | Why it is needed |
| --- | --- |
| Test framework and runner | Determines test file shape and how a single test is executed |
| Assertion style | Fluent, plain, or matcher-based; tests must read consistently |
| Test-double approach | A mocking library, framework-built-in fakes, or hand-written fakes and in-memory implementations |
| Focused-run command | The inner Red-Green loop must be fast; a full-suite run per loop makes TDD unusable |
| Full-suite command | Required before the work is reported as done |
| Test project/file placement | Where a new test file belongs, and how it is named |

Record these in the working notes for the task. If the repository has no durable record of them and they were just settled, say so and point the user at `/agent-instructions` to add them to `AGENTS.md`; do not write that file from here.

## Adapting The Loop To Any Stack

The protocol does not change with the stack; only the mechanics do.

- **Focused run.** Every mainstream runner can filter to one test, class, or file. Find that filter flag from the runner's own help or config rather than guessing a syntax from another ecosystem.
- **Red must be observed.** Run the new test and see it fail for the intended reason before writing production code. A test that passes on first run is not Red — it is either asserting nothing, or the behavior already exists.
- **Test doubles.** Prefer the seam the repository already uses. Where no mocking library is present, a hand-written fake or in-memory implementation is a legitimate choice and often the better one; adding a mocking library is a stack decision requiring user agreement.
- **Isolation.** Whatever the stack, control time, randomness, network, filesystem, and clock through injectable seams so the focused loop stays deterministic.
- **No framework mixing.** If the needed test cannot be expressed in the repository's framework, that is a finding to report, not a licence to add a second framework.

## When No Tests Exist Yet

- A repository with no test suite cannot start a Red step until the framework is chosen. When planning needs executable commands before the first behavior slice, run `/tdd` in stack-settlement mode: ask for every item above, write no code or package configuration, and emit exact `/agent-instructions` handoff text that records the choices. Otherwise ask at the start of the first behavior change.
- After the choices are durable, add the smallest possible test setup alongside the first failing test, consistent with the manifest and the user's choice — one framework, no extra tooling.
- Do not create a broad test scaffold, shared base classes, or helper layers in advance. Add only what the first failing test needs.
