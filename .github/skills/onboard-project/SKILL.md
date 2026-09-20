---
name: onboard-project
description: "Assess repository state and sequence the owning skills, including missing or stale workflow artifacts."
argument-hint: "Ask to onboard this repo, or name the subtree to scope discovery to"
user-invocable: true
---

# Onboard Project

The entry point to the workflow. Detect repository-wide facts once, then sequence the owning skills with tailored in-memory handoffs so the user never has to work out the order themselves.

This skill writes no durable artifact of its own, produces no onboarding status or TODO file, and decides no domain policies. It acts as a thin repository classifier and workflow router.

## When To Use

Whenever starting or resuming work on a repository that is not already in the steady-state loop. It handles an empty directory, a bare scaffold, and a mature codebase alike, so the user does not need to classify the repository before invoking it.

Do not use it when only one artifact is missing and the rest are current — call that owning skill directly.

## Detect First

Read-only inspection per [references/DISCOVERY-CHECKLIST.md](references/DISCOVERY-CHECKLIST.md). Establish repository-wide facts before routing.

**Code maturity**

| Signal | State |
| --- | --- |
| No manifest anywhere in scope (`*.sln`/`*.csproj`, `package.json`, `pyproject.toml`, `go.mod`) | `empty` |
| Manifest present, but source is only default template or generator boilerplate | `scaffold` |
| Manifest present with real source and/or tests | `mature` |

**Artifact maturity** — presence and apparent currency of `.workflow/CONTEXT.md`, `.workflow/UBIQUITOUS-LANGUAGE.md`, `.workflow/prd/`, `.workflow/plans/`, and `AGENTS.md`.

**Detected stacks** — record detected manifests and languages.

**Instruction file condition** — check for competing root instruction files (`AGENT.md`, `AGENTS.md`, `.github/copilot-instructions.md`).

**Git condition** — check whether Git is initialized and whether a clean baseline exists.

Do not assess test-suite maturity, style violations, mutation testing thresholds, E2E readiness, or acceptance criteria in this skill. Those decisions belong strictly to their respective domain owners.

## Rule 1: Resolve Competing Instruction Files First

Blocking and mechanical repository normalization. Before any skill runs:

- `AGENT.md` (singular) must be renamed to `AGENTS.md`. Never leave both.
- If both `AGENTS.md` and `.github/copilot-instructions.md` exist, ask the user which is canonical and remove the other. Resolving this here avoids redundant stops downstream.

Treat any pre-existing `AGENTS.md` as unverified startup evidence, not durable truth. `agent-instructions` reconciles guidance against PRD, plan, and conventions when it runs.

## Rule 2: Tailored, Disposable Handoffs

All handoffs to downstream skills and agents are conducted in-memory using the envelope specification in [references/ONBOARDING-HANDOFF.md](references/ONBOARDING-HANDOFF.md).
- Tailor each handoff by selecting only the fields needed by the recipient.
- Never write the envelope or an onboarding status checklist to disk.
- If an owner is already current (idempotent re-entry), that owner reports completion immediately without repeating work.

## Rule 3: Route By Code Maturity

**`empty`** — the stack is unknown, so no stack-specific adapters can run:

1. `brain-storm` — interview to establish product context; outputs `.workflow/CONTEXT.md` and `.workflow/UBIQUITOUS-LANGUAGE.md`.
2. `prd-writer` — settle target architecture, stack, and constraints; outputs `.workflow/prd/PRD.md`.
3. `work-planner` — plan Phase 0 as a scaffolding phase; outputs `.workflow/plans/PLAN.md`.
4. Establish clean Git baseline containing onboarding artifacts created so far.
5. Execute scaffolding slice via `Orchestrator` (run as active agent mode, never through a subagent tool; dispatches implementation to `Engineer`).
6. Code-style protocol / matching adapter (see Rule 4), now that a manifest exists.
7. Mutation-testing protocol / matching adapter (see Rule 5), establishing root config.
8. `agent-instructions` (see Rule 6).
9. `deterministic-verification` (see Rule 7).

Before executing the first scaffolding slice in an empty repository, establish a clean Git baseline containing the onboarding artifacts created so far, while leaving the planned slice files uncommitted. Do this as the primary agent or user, never by dispatching it to `Engineer`; the deterministic gate compares the slice report with the post-baseline change set.

**`scaffold`** — manifest and stack are known; style and mutation config can be established immediately:

1. Code-style protocol / matching adapter (see Rule 4) at blocking severity.
2. Mutation-testing protocol / matching adapter (see Rule 5) establishing root configuration.
3. `brain-storm` -> `prd-writer` -> `work-planner`.
4. `agent-instructions` (see Rule 6).
5. `deterministic-verification` (see Rule 7).

**`mature`** — existing code and tests present; treat legacy debt as plan work:

1. Code-style protocol / matching adapter (see Rule 4) at non-blocking severity.
2. Mutation-testing protocol / matching adapter (see Rule 5) to establish config and report baseline status.
3. `brain-storm` -> `prd-writer` -> `work-planner`. `work-planner` receives the style and mutation findings, inspects E2E readiness directly, and sequences necessary remediation into phase slices.
4. `agent-instructions` (see Rule 6).
5. `deterministic-verification` (see Rule 7).

## Rule 4: Route Code Style Setup

Delegate code style configuration to the code-style protocol and matching adapter per [`code-style/protocol.md`](../code-style/protocol.md):
- .NET (`*.sln`, `*.csproj`) -> `dotnet-editorconfig`
- TypeScript / JavaScript (`package.json`) -> `ts-eslint`
- Other stacks -> report missing adapter plainly; continue routing other steps.

The code-style adapter self-assesses configuration presence, executes setup, verifies formatting/linting, and reports its outcome.

## Rule 5: Route Mutation Testing Setup

Delegate mutation testing setup to the mutation-testing protocol and matching adapter per [`mutation-testing/protocol.md`](../mutation-testing/protocol.md):
- .NET (`*.sln`, `*.csproj`) -> `stryker-dotnet`
- TypeScript / JavaScript (`package.json`) -> `stryker-js`
- Other stacks -> report missing adapter plainly; continue routing other steps.

The mutation-testing adapter self-assesses test framework readiness, guides root configuration walkthrough, and reports its status.

## Rule 6: `agent-instructions` Runs After Conventions And Plans Exist

`agent-instructions` requires durable context (`.workflow/CONTEXT.md`, `.workflow/UBIQUITOUS-LANGUAGE.md`), PRD, plan, and confirmed repository conventions to generate or update `AGENTS.md`. It runs near the end of the routing sequence.

## Rule 7: Route Deterministic Verification Idempotently

Route explicitly to `deterministic-verification`, passing `onboarding_mode` and `repository_scope`.
`deterministic-verification` owns running its bootstrap command idempotently, verifying required tooling (such as `jq` and Git Bash on Windows), and reporting bootstrap status. `onboard-project` does not invoke scripts or restate tool prerequisites directly.

## Boundaries

- Never write `.workflow/CONTEXT.md`, `.workflow/UBIQUITOUS-LANGUAGE.md`, the PRD, plan artifacts, `AGENTS.md`, or style/mutation configs directly. Always delegate to the owning skill.
- Never write an onboarding status file, TODO artifact, or checklist in the repository. Canonical plans remain the sole record of project progress.
- Never delegate `brain-storm`, `prd-writer`, `work-planner`, `agent-instructions`, or code-style/mutation-testing adapters to `Engineer` or any other subagent. Run each directly in the primary conversation with the user.
- Do not inspect test code, assert test-suite adequacy, design acceptance scenarios, or evaluate E2E harness readiness in this skill. `work-planner` owns E2E discovery and slice planning; `qa-design` / `QA` owns requirement-based scenario design.
- Re-running this skill is idempotent: owners verify their own domain state and skip already-current artifacts.

## Exit

Return a concise aggregate brief: detected code maturity, detected stacks, instruction-file conflicts resolved, which skills ran, and which artifacts were created or updated. All durable state lives in owned artifacts; this brief is disposable.
