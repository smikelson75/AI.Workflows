# Project Guidelines

## Scope And Intent
- This repository defines workflow, skill, and agent contracts. It does not define product-domain code or stack-specific architecture.
- Keep durable guidance in owned artifacts; do not turn chat handoffs or status updates into competing long-lived documents.

## Workflow Boundaries
- Respect artifact ownership and handoff gates documented in [docs/workflow.md](docs/workflow.md) and [docs/artifacts.md](docs/artifacts.md).
- Route changes by truth type:
  - Product truth changes (problem, users, workflow, vocabulary) -> `brain-storm`.
  - Target truth changes (required behavior, hard constraints, target architecture) -> `prd-writer`.
  - Implementation sequencing/status/slice readiness -> `work-planner`.
- `Orchestrator` is a router and plan-status updater; it does not implement product code. `Coding Agent` implements dispatched scope and verifies outcomes.

## Change Discipline
- Keep edits surgical and scoped to the owning file(s).
- Update only the smallest necessary field/section; avoid broad rewrites.
- Prefer links to authoritative docs instead of duplicating long guidance.
- When changing a skill or agent contract, also update related catalog or workflow docs in the same change when required by [docs/extending.md](docs/extending.md).

## Token Efficiency Requirements
- Load only the artifacts required for the current handoff and reuse unchanged context.
- Keep dispatch payloads compact: pass slice scope, invariants, verification command, and acceptance checks only.
- Keep progress and completion reports concise; include only changed files, verification evidence, and blockers/risks.
- Minimize artifact churn: do not create duplicate status records or restate durable content across artifacts.

## Verification Expectations
- No single repository-wide build or test command is prescribed in current docs.
- For each change, run focused validation commands relevant to touched files and report what was executed and the result.
- If a necessary verification command is not documented, surface that gap explicitly instead of inventing a project convention.

## Canonical References
- Workflow and handoffs: [docs/workflow.md](docs/workflow.md)
- Skills catalog: [docs/skills.md](docs/skills.md)
- Agents catalog: [docs/agents.md](docs/agents.md)
- Artifacts and lifecycle: [docs/artifacts.md](docs/artifacts.md)
- Extension and contract change rules: [docs/extending.md](docs/extending.md)