---
name: tdd-typescript
description: "Implement TypeScript behavior changes with Red-Green-Refactor and Jest."
argument-hint: "Describe the behavior change and target layer"
user-invocable: true
disable-model-invocation: false
---

# TDD TypeScript Workflow

Stack: Jest, including Jest mock functions and module mocks.

Load before implementing:
- `.github/skills/tdd/protocol.md` (generic Red-Green-Refactor)
- `.github/skills/tdd/test-design.md` (generic test design)
- `.github/skills/tdd-typescript/docs/stack.md` (TypeScript specifics)

Non-negotiables:
- No completion with failing tests.
- Failing Jest test (Red) before production change.
- Focused Jest test loop before full project test suite.