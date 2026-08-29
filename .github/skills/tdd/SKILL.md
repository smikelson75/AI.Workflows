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

## Workflow

1. **Settle the stack.** Follow `references/STACK-DISCOVERY.md` to determine the test framework, the test-double approach, the focused-run command, and the full-suite command. Never assume a default; discovered evidence beats convention, and an explicit user choice beats both.
2. **Match what exists.** When tests already exist, copy their framework, file layout, naming, and assertion style even if you would choose differently. Introducing a second framework alongside a working one is a stack decision, not an implementation detail — surface it instead of doing it.
3. **Run the loop** per `references/PROTOCOL.md`, one behavior at a time, designing each test per `references/TEST-DESIGN.md`.
4. **Finish on the full suite** using the command settled in step 1.

## Non-Negotiables

- A failing test (Red) exists before the production change that makes it pass.
- One behavior per loop; the smallest production change that turns the test green.
- Refactor only while green.
- Never complete with failing tests, skipped tests added to avoid a failure, or a weakened assertion used to force a pass.
- Never add or swap a test framework, assertion library, or mocking library without an explicit user decision.

## Boundaries

- Does not choose the repository's testing packages; it adapts to them.
- Does not configure coverage, style, or mutation testing. Mutation testing is `mutation-testing`; style enforcement is the stack's code style adapter.
- Does not decide whether a slice needs integration or end-to-end tests. That is planned by `work-planner` and stated in the slice's verification commands; this skill governs how any of those tests are written.
- Does not write plan, PRD, or context artifacts.
