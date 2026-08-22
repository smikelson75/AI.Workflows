# Skills Catalog

Skills are user-invocable workflows. Each `SKILL.md` defines its contract, read order, boundaries, and durable outputs.

## Product And Repository Discovery

### `brain-storm`

Invoke with `/brain-storm` when product intent is vague or changing. It interviews one focused question at a time, normalizes vocabulary, and writes `CONTEXT.md` plus `UBIQUITOUS-LANGUAGE.md`. It stops when product decisions are clear and waits for confirmation before acting.

### `onboard-existing-project`

Invoke with `/onboard-existing-project` for an existing codebase missing the standard artifacts. It performs evidence-based discovery, flags contradictions, and sequences the owning skills. It does not write those artifacts itself.

## Target And Repository Guidance

### `prd-writer`

Invoke with `/prd-writer` after context is settled. It writes the target-state PRD at `docs/prd/<artifact-slug>-prd.md`, deriving `<artifact-slug>` from `UBIQUITOUS-LANGUAGE.md` or, if needed, `CONTEXT.md`. It does not describe maturity, progress, plans, tasks, or status.

### `agent-instructions`

Invoke with `/agent-instructions` to bootstrap or amend project-wide `AGENTS.md`. It uses verified repository evidence and links to detailed documentation. It must not compete with `.github/copilot-instructions.md`; choose one canonical project-wide instruction primitive.

### `workflow-audit`

Invoke with `/workflow-audit` when workflow definitions change or orchestration becomes repetitive or expensive. It audits token waste, duplicated authority, contradictions, oversized handoffs, and artifact churn. Audit mode is read-only; repair mode applies only approved minimal edits.

## Planning And Implementation

### `work-planner`

Invoke with `/work-planner` after context and PRD are current. It owns the implementation gap, phase and slice artifacts, sequencing, and status assumptions. The main plan is the single status record.

### `tdd-csharp`

Invoke for C# behavior changes. It requires xUnit, Moq, and FluentValidation references, a failing test before production code, focused test loops, and a final full `dotnet test`.

## Change Journaling

### `conventional-commit`

Invoke with `/conventional-commit` after a coherent change is verified. It inspects status and diffs, stages only the intended files, chooses an allowed lowercase type, and commits with a subject of no more than 100 characters.

## Skill References

Use the references beside each skill for its format or protocol details:

- [`brain-storm` references](../.github/skills/brain-storm/references/CONTEXT-FORMAT.md)
- [`prd-writer` references](../.github/skills/prd-writer/references/PRD-FORMAT.md)
- [`work-planner` references](../.github/skills/work-planner/references/PLAN-FORMAT.md)
- [`tdd` protocol](../.github/skills/tdd/protocol.md)
- [`tdd` test design](../.github/skills/tdd/test-design.md)
- [`conventional-commit` types](../.github/skills/conventional-commit/references/types.md)