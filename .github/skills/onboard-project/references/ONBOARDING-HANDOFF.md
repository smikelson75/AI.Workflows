# Onboarding Handoff Reference

## Purpose And Lifecycle

This reference defines the in-memory onboarding envelope passed from `onboard-project` to downstream skills and agents.

The onboarding envelope is:
- **In-memory and disposable**: passed through chat/invocation context during workflow routing.
- **Never written to disk**: no onboarding status file, TODO list, checklist, or tracking artifact is ever created in the target repository.
- **Startup evidence, not durable truth**: recipients treat values as unverified hints and perform their own domain-specific validation.
- **Optional for direct invocation**: when a skill is invoked directly by a user without an envelope, the skill falls back to its existing self-detection and read order without guessing missing facts.

## Envelope Field Specification

`onboard-project` detects repository-wide facts once and tailors each handoff by selecting only the fields relevant to the recipient. It never includes domain policy or conclusions (such as mutation thresholds, style severity or violation counts, E2E test adequacy, phase design, acceptance scenarios, or implementation tasks).

| Field | Type | Evidence source | Eligible recipients | Omission behavior |
| --- | --- | --- | --- | --- |
| `onboarding_mode` | Enum: `empty`, `scaffold`, `mature` | Manifest presence and source code inspection | All recipients | Never omitted in routed handoffs. When omitted (direct invocation), recipient runs local mode detection. |
| `repository_scope` | String (path or `.`) | User prompt argument or confirmed subtree | All recipients | Never omitted in routed handoffs (defaults to `.`). Recipient scopes inspection to this path. |
| `detected_stacks` | Array of objects: `{ name, manifest, language }` | Discovered project/package manifests (`*.sln`, `*.csproj`, `package.json`, `pyproject.toml`, `go.mod`, etc.) | Code-style protocol/adapters, mutation-testing protocol/adapters, `deterministic-verification`, `agent-instructions` | Omitted when stack is unknown (`empty` before scaffolding) or irrelevant to the recipient (e.g., `brain-storm`, `qa-design`/`QA`). |
| `workflow_artifacts` | Object: key-value map of canonical artifact path to status (`present`, `missing`, `stale`) | File existence check of `.workflow/CONTEXT.md`, `.workflow/UBIQUITOUS-LANGUAGE.md`, `.workflow/prd/`, `.workflow/plans/`, `AGENTS.md` | `brain-storm`, `prd-writer`, `work-planner`, `agent-instructions` | Omitted when irrelevant to the recipient (e.g., code-style and mutation-testing adapters). |
| `competing_instructions` | Enum: `none`, `resolved` | Root instruction file check (`AGENT.md`, `AGENTS.md`, `.github/copilot-instructions.md`) | `agent-instructions` | Omitted after normalization or when irrelevant to the recipient. |
| `git_condition` | Object: `{ initialized: boolean, clean: boolean, baseline_established: boolean }` | `git status` and `.git` directory presence | `Orchestrator`, `deterministic-verification` | Omitted when Git status is not required by the recipient. |
| `unresolved_contradictions` | Array of strings | Surface-level repository contradictions discovered during classification | `brain-storm`, `prd-writer` | Omitted when empty or irrelevant to recipient. |

## Prohibited Contents

The onboarding envelope must never contain:
- Style configuration rules, severity levels, or violation counts (owned by code-style adapters).
- Mutation thresholds, test framework runner details, or Stryker configs (owned by mutation-testing adapters).
- E2E coverage percentages, test harness maturity ratings, or test execution results (owned by `work-planner`).
- Requirement-based acceptance scenarios or Gherkin features (owned by `qa-design` / `QA`).
- Implementation tasks, slice definitions, or phase plans (owned by `work-planner`).
- Long-lived status records or progress checklists (prohibited; canonical plans remain the sole progress record).

## Recipient Expectations

Each receiving skill or agent:
1. **Self-assesses domain state**: Uses the envelope fields as starting evidence, verifies needed domain facts locally, and determines whether its domain is already current (idempotent re-entry).
2. **Never guesses missing facts**: If a required envelope field is absent, performs the smallest targeted domain check or asks the user directly.
3. **Returns a concise outcome**: Reports completed work, blockers, or next recommended handoff to the caller.
4. **Maintains domain authority**: Writes only its own canonical artifacts; never delegates domain decisions back to `onboard-project`.

## Example Tailored Handoff

Tailored handoff from `onboard-project` to `work-planner` for a mature TypeScript repository:

```yaml
onboarding_handoff:
  onboarding_mode: mature
  repository_scope: "."
  workflow_artifacts:
    .workflow/CONTEXT.md: present
    .workflow/UBIQUITOUS-LANGUAGE.md: present
    .workflow/prd/PRD.md: present
    .workflow/plans/PLAN.md: missing
    AGENTS.md: present
  unresolved_contradictions: []
```

Notice that stack-specific style configs, mutation parameters, E2E test results, and deterministic script mechanics are omitted because they are not repository-wide routing facts for `work-planner`.
