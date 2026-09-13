---
name: tdd-typescript
description: "Implement TypeScript/JavaScript behavior changes with Red-Green-Refactor and repository-configured test runners."
argument-hint: "Describe the behavior change and target package or file"
user-invocable: true
disable-model-invocation: false
---

# TDD TypeScript Workflow

Stack: TypeScript / JavaScript test runners (`node:test`, Vitest, Jest, Mocha).

Load before implementing:
- [protocol.md](../tdd/protocol.md) (shared Red-Green-Refactor protocol)
- [test-design.md](../tdd/test-design.md) (shared test design standards)
- [docs/stack.md](docs/stack.md) (TypeScript runner discovery and command patterns)

## Non-Negotiables
- No completion with failing tests.
- Failing test (Red evidence) before production code change.
- Test-bearing full suite command required for behavior changes.
- Static verification (`tsc`, ESLint, Prettier) runs in addition to tests, never instead of tests.
- Never invent a test command: discover from repository package scripts or configuration.
