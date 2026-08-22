---
name: tdd-csharp
description: "Implement C# behavior changes with Red-Green-Refactor, xUnit, and Moq."
argument-hint: "Describe the behavior change and target layer"
user-invocable: true
disable-model-invocation: false
---

# TDD C# Workflow

Stack: xUnit, Moq.

Load before implementing:
- `.github/skills/tdd/protocol.md` (generic Red-Green-Refactor)
- `.github/skills/tdd/test-design.md` (generic test design)
- `.github/skills/tdd-csharp/docs/stack.md` (C# specifics)

Non-negotiables:
- No completion with failing tests.
- Failing test (Red) before production change.
- Full `dotnet test` before done.
