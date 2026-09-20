# Repo Discovery Checklist

Purpose: guide read-only repository inspection to gather repository-wide facts needed to classify maturity and build the tailored [ONBOARDING-HANDOFF.md](ONBOARDING-HANDOFF.md) envelope. Read-only; produces in-memory facts, not a written or durable artifact.

Product intent, user identification, architecture inference, and glossary drafting are owned by `brain-storm` and are not performed here.

## 1. Scope And Manifests

- Confirm requested repository scope (root `.` or named subtree).
- Inspect package/project manifests (`package.json`, `*.sln`/`*.csproj`, `pyproject.toml`, `go.mod`, etc.).
- Identify detected stacks and build tools.

## 2. Code Maturity Classification

- **`empty`**: no project manifest found anywhere in scope.
- **`scaffold`**: manifest present, but source code is only default template or generator boilerplate.
- **`mature`**: manifest present with real application source code and/or tests.

## 3. Workflow Artifact Presence

Check presence and apparent currency of canonical workflow files:
- `.workflow/CONTEXT.md`
- `.workflow/UBIQUITOUS-LANGUAGE.md`
- `.workflow/prd/`
- `.workflow/plans/`
- `AGENTS.md`

## 4. Root Instruction Files

Check for competing instruction files to normalize before routing:
- `AGENT.md` (singular)
- `AGENTS.md`
- `.github/copilot-instructions.md`

## 5. Git Condition

- Is Git initialized (`.git` directory present)?
- Is working tree clean?
- Is baseline established when needed for scaffolding?

## 6. Repository-Wide Contradictions

- Surface-level mismatches (e.g., README claims stack X while codebase manifests specify stack Y).
- Flag without attempting to resolve domain questions; pass flagged items to `brain-storm` or `prd-writer`.

## Output

In-memory classification facts used to populate the tailored [ONBOARDING-HANDOFF.md](ONBOARDING-HANDOFF.md) envelope for the next owning skill or agent. Never written to a file.
