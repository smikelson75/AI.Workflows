---
name: tdd
description: "Implement a behavior change with Red-Green-Refactor using whatever test stack the repository already uses."
argument-hint: "Describe the behavior change and target layer"
user-invocable: true
disable-model-invocation: false
---

# TDD

Stack-agnostic. This skill owns the Red-Green-Refactor loop and test-design standards. It does not own the choice of test framework, assertion library, mocking library, or runner — the repository does, and where the repository has not decided, the user does.

Load before implementing:

- [references/PROTOCOL.md](references/PROTOCOL.md) — Red-Green-Refactor loop
- [references/TEST-DESIGN.md](references/TEST-DESIGN.md) — what makes a good test
- [references/STACK-DISCOVERY.md](references/STACK-DISCOVERY.md) — how to find or settle the repository's test stack and commands

## Modes

- **Behavior** (default): settle or discover the stack, then implement one behavior through Red-Green-Refactor.
- **Verification-only**: add or run unit, integration, contract, process, or end-to-end tests for behavior already implemented by earlier work. Production behavior and production files are out of scope, so the test may pass on its first run. If it exposes missing behavior that requires a production change, stop and reclassify that work as a Behavior slice before editing production code.
- **Stack settlement**: use after scaffolding when no test suite exists and `work-planner` cannot state executable commands for the first behavior slice. Ask the user to choose the framework/runner, assertion style, test-double approach, test placement, and focused/full-suite commands using `references/STACK-DISCOVERY.md`. Do not install packages, create a test project, or write a placeholder test. Return the settled choices plus exact text for `/agent-instructions`; the first behavior slice creates only the test setup its first failing test needs.

## Workflow

1. **Settle the stack.** Follow `references/STACK-DISCOVERY.md` to determine the test framework, assertion style, test-double approach, test placement, focused-run command, and full-suite command. Never assume a default; discovered evidence beats convention, and an explicit user choice beats both. In stack-settlement mode, emit the `/agent-instructions` handoff and stop here.
2. **Match what exists.** When tests already exist, copy their framework, file layout, naming, and assertion style even if you would choose differently. Introducing a second framework alongside a working one is a stack decision, not an implementation detail — surface it instead of doing it.
3. **Run the loop** per `references/PROTOCOL.md`, one behavior at a time, designing each test per `references/TEST-DESIGN.md` and retaining the command and decisive output excerpt from each Red and final focused Green run.
4. **Finish on the full suite** using the command settled in step 1.

## Non-Negotiables

- A failing test (Red) exists and was run before the production change that makes it pass. Writing the test after the code, even to match its behavior, is not TDD.
- Test level does not change the loop. Use the smallest practical unit, integration, contract, process, or end-to-end test at the nearest boundary where the behavior is observable, and run it Red before changing production code.
- One behavior per loop; the smallest production change that turns the test green. A single test covering an entire workstream, followed by writing all the code for it, is not TDD — slice smaller and loop per `references/PROTOCOL.md`.
- Refactor only while green; keep tests passing after every refactor step.
- Retain compact chronological evidence for every loop: behavior intent, the focused Red command and enough failure output to identify the test and expected reason, and the final focused Green command and passing output after any refactoring. A suite-level failure count alone is not Red evidence.
- Never complete with failing tests, skipped tests added to avoid a failure, or a weakened assertion used to force a pass.
- Never add or swap a test framework, assertion library, or mocking library without an explicit user decision.

## Boundaries

- Does not choose the repository's testing packages; it adapts to them.
- Does not configure coverage, style, or mutation testing. Mutation testing is `mutation-testing`; style enforcement is the stack's code style adapter.
- Does not decide whether a slice needs integration or end-to-end tests. That is planned by `work-planner` and stated in the slice's verification commands; this skill governs how any of those tests are written.
- Does not write plan, PRD, or context artifacts.
