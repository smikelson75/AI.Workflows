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

### `deterministic-verification`

Invoke with `/deterministic-verification` to validate Engineer reports, evaluate boundary changes, route the integration-only Pass B, enforce explicit verification commands, and run phase-end E2E checks. It owns the local policies, schemas, scripts, hooks, and task entry points; `Orchestrator` owns routing and status, while `Engineer` owns implementation and reports.

### `adr-writer`

Invoked directly, or from within `prd-writer`/`work-planner` when a decision is hard to reverse, surprising without context, and reflects a real trade-off among alternatives. Writes a point-in-time record at `docs/adr/NNNN-<slug>.md`. Never edited in place; a new ADR supersedes an old one.

## Planning And Implementation

### `work-planner`

Invoke with `/work-planner` after context and PRD are current. It owns the implementation gap, phase and slice artifacts, sequencing, and status assumptions. The main plan is the single status record.

### `tdd-csharp`

Invoke for C# behavior changes. It requires xUnit and Moq references, a failing test before production code, focused test loops, and a final full `dotnet test`.

### `dotnet-editorconfig`

The C#/.NET adapter for the generic code style protocol. Invoke with `/dotnet-editorconfig` to write the root `.editorconfig` from an industry baseline or a guided per-rule walkthrough, plus the root `Directory.Build.props` that makes style and analyzer rules run at compile time. Both files are inherited by projects created later, so no per-project opt-in is needed. Enforcement rules, maturity paths, and the `agent-instructions` handoff live in the shared protocol, not here. Adapters for other stacks do not exist yet; `onboard-project` reports the gap rather than improvising.

### `stryker-dotnet`

The C#/.NET adapter for the generic mutation-testing protocol. Invoke with `/stryker-dotnet` to write `stryker-config.json`, scoped to unit tests only (integration/e2e tests are permanently excluded), and to run a guided threshold walkthrough instead of silently picking a mutation-score bar. Cadence (phase's final integration slice, incremental scope), blocking policy, repository maturity paths, and survivor remediation live in the shared protocol, not here. Adapters for other stacks do not exist yet; `onboard-project` reports the gap rather than improvising.

## Change Journaling

### `conventional-commit`

Invoke with `/conventional-commit` after a coherent change is verified. It inspects status and diffs, stages only the intended files, chooses an allowed lowercase type, and commits with a subject of no more than 100 characters.

## Skill References

Use the references beside each skill for its format or protocol details:

- [`brain-storm` references](../.github/skills/brain-storm/references/CONTEXT-FORMAT.md)
- [`prd-writer` references](../.github/skills/prd-writer/references/PRD-FORMAT.md)
- [`work-planner` references](../.github/skills/work-planner/references/PLAN-FORMAT.md)
- [`adr-writer` references](../.github/skills/adr-writer/references/ADR-FORMAT.md)
- [`tdd` protocol](../.github/skills/tdd/protocol.md)
- [`tdd` test design](../.github/skills/tdd/test-design.md)
- [`code-style` protocol](../.github/skills/code-style/protocol.md)
- [`dotnet-editorconfig` baseline](../.github/skills/dotnet-editorconfig/references/BASELINE.md)
- [`dotnet-editorconfig` enforcement](../.github/skills/dotnet-editorconfig/references/ENFORCEMENT.md)
- [`mutation-testing` protocol](../.github/skills/mutation-testing/protocol.md)
- [`onboard-project` discovery checklist](../.github/skills/onboard-project/references/DISCOVERY-CHECKLIST.md)
- [`conventional-commit` types](../.github/skills/conventional-commit/references/types.md)
