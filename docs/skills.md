# Skills Catalog

Skills are user-invocable workflows. Each `SKILL.md` defines its contract, read order, boundaries, and durable outputs.

## Product And Repository Discovery

### `brain-storm`

Invoke with `/brain-storm` when product intent is vague or changing. It interviews one focused question at a time, normalizes vocabulary, and writes `CONTEXT.md` plus `UBIQUITOUS-LANGUAGE.md`. It stops when product decisions are clear and waits for confirmation before acting.

### `onboard-project`

Invoke with `/onboard-project` as the entry point to the workflow. It detects code maturity (empty, scaffold, mature), artifact maturity, and stack, then sequences the owning skills in the correct order for that state. It resolves competing instruction files first, dispatches the matching code style adapter, and performs evidence-based discovery for existing codebases. It writes no artifact itself.

## Target And Repository Guidance

### `prd-writer`

Invoke with `/prd-writer` after context is settled. It writes the target-state PRD at `docs/prd/<artifact-slug>-prd.md`, deriving `<artifact-slug>` from `UBIQUITOUS-LANGUAGE.md` or, if needed, `CONTEXT.md`. It does not describe maturity, progress, plans, tasks, or status.

### `agent-instructions`

Invoke with `/agent-instructions` to bootstrap or amend project-wide `AGENTS.md`. It uses verified repository evidence and links to detailed documentation. It must not compete with `.github/copilot-instructions.md`; choose one canonical project-wide instruction primitive.

### `workflow-audit`

Invoke with `/workflow-audit` when workflow definitions change or orchestration becomes repetitive or expensive. It audits token waste, duplicated authority, contradictions, oversized handoffs, and artifact churn. Audit mode is read-only; repair mode applies only approved minimal edits.

### `adr-writer`

Invoked directly, or from within `prd-writer`/`work-planner` when a decision is hard to reverse, surprising without context, and reflects a real trade-off among alternatives. Writes a point-in-time record at `docs/adr/NNNN-<slug>.md`. Never edited in place; a new ADR supersedes an old one.

## Planning And Implementation

### `work-planner`

Invoke with `/work-planner` after context and PRD are current. It owns the implementation gap, phase and slice artifacts, sequencing, and status assumptions. The main plan is the single status record.

### `tdd`

Invoke with `/tdd` for any behavior change. It is stack-agnostic and test-level agnostic: the smallest practical unit, integration, contract, process, or end-to-end test at the nearest observable boundary may drive Red-Green-Refactor. It discovers the repository's existing test framework, assertion style, test-double approach, placement, and focused/full-suite commands before the first Red step, and asks the user when nothing settles the choice. Verification-only tests for behavior implemented earlier may pass initially but cannot include production changes; a discovered production gap becomes a behavior slice. It never introduces or swaps a testing package on its own.

### `dotnet-editorconfig`

The C#/.NET adapter for the generic code style protocol. Invoke with `/dotnet-editorconfig` to write the root `.editorconfig` from an industry baseline or a guided per-rule walkthrough, plus the root `Directory.Build.props` that makes style and analyzer rules run at compile time. Both files are inherited by projects created later, so no per-project opt-in is needed. Enforcement rules, maturity paths, and the `agent-instructions` handoff live in the shared protocol, not here. Adapters for other stacks do not exist yet; `onboard-project` reports the gap rather than improvising.

### `mutation-testing`

Opt-in and tool-agnostic. Invoke with `/mutation-testing` to select a mutation tool with the user, agree a cadence and thresholds through a guided walkthrough, and write that tool's root configuration scoped to unit tests only — or to run the configured command for the current phase and route survivors. It never enables itself, never picks the tool, and never adds a mutation run to a verification command the user has not agreed to.

## Change Journaling

### `conventional-commit`

Invoke with `/conventional-commit` after a coherent change is verified. It inspects status and diffs, stages only the intended files, chooses an allowed lowercase type, and commits with a subject of no more than 100 characters.

## Skill References

Use the references beside each skill for its format or protocol details:

- [`brain-storm` references](../.github/skills/brain-storm/references/CONTEXT-FORMAT.md)
- [`prd-writer` references](../.github/skills/prd-writer/references/PRD-FORMAT.md)
- [`work-planner` references](../.github/skills/work-planner/references/PLAN-FORMAT.md)
- [`adr-writer` references](../.github/skills/adr-writer/references/ADR-FORMAT.md)
- [`tdd` protocol](../.github/skills/tdd/references/PROTOCOL.md)
- [`tdd` test design](../.github/skills/tdd/references/TEST-DESIGN.md)
- [`tdd` stack discovery](../.github/skills/tdd/references/STACK-DISCOVERY.md)
- [`code-style` protocol](../.github/skills/code-style/protocol.md)
- [`dotnet-editorconfig` baseline](../.github/skills/dotnet-editorconfig/references/BASELINE.md)
- [`dotnet-editorconfig` enforcement](../.github/skills/dotnet-editorconfig/references/ENFORCEMENT.md)
- [`mutation-testing` protocol](../.github/skills/mutation-testing/references/PROTOCOL.md)
- [`mutation-testing` tool selection](../.github/skills/mutation-testing/references/TOOL-SELECTION.md)
- [`onboard-project` discovery checklist](../.github/skills/onboard-project/references/DISCOVERY-CHECKLIST.md)
- [`conventional-commit` types](../.github/skills/conventional-commit/references/types.md)
