---
name: deterministic-verification
description: "Run deterministic integration gating, structured Engineer handoffs, and phase-end E2E verification around agent-executed slices."
argument-hint: "Name a slice, phase, report, or ask to evaluate the integration gate"
user-invocable: true
---

# Deterministic Verification

Use this skill when an implementation slice needs the deterministic integration-gate workflow: structured Engineer handoff reports, an automated integration-gate evaluation, and phase-end E2E verification, as detailed below.

## Onboarding Input

When routed from `onboard-project`, this skill receives `onboarding_mode`, `repository_scope`, and `git_condition` via the [onboarding handoff](../onboard-project/references/ONBOARDING-HANDOFF.md).
1. Runs `.github/skills/deterministic-verification/scripts/bootstrap-deterministic-verification.sh` idempotently.
2. Checks necessary prerequisites (such as `jq` and Git Bash on Windows).
3. If prerequisites are missing or artifacts are absent, reports the setup status or failure plainly.
4. Returns the bootstrap outcome to the caller; never writes an onboarding status or TODO artifact.

When invoked directly without an onboarding envelope, performs local checks and script runs as requested.

## Ownership

- `work-planner` owns slice scope, verification commands, and acceptance checks.
- `qa-design` owns the phase acceptance feature; human approval is recorded in the main plan.
- `Orchestrator` owns routing, gate evaluation, and plan status.
- `Engineer` owns implementation, tests, and the structured report for its assigned pass.
- This skill owns the policy, schemas, scripts, hooks, and task entry points that make those handoffs deterministic.

Do not create a second agent for Pass B. It is the existing `Engineer` role operating under an integration-only brief.

## Workflow

1. Bootstrap local deterministic verification once per repository with `.github/skills/deterministic-verification/scripts/bootstrap-deterministic-verification.sh`.
2. Validate the Engineer A report with `.github/skills/deterministic-verification/scripts/validate-report.sh`.
3. Run `.github/skills/deterministic-verification/scripts/evaluate-integration-gate.sh` against the report. The gate derives changed files from Git and blocks when they do not match the report.
4. If `integrationRequired` is `true`, have `Orchestrator` dispatch Pass B to `Engineer` with only the gate targets and integration scope.
5. Validate the Engineer B report and run its integration verification command.
6. Allow `Orchestrator` to mark the slice complete only after all required checks pass.
7. Require approved phase Gherkin, then run `.github/skills/deterministic-verification/scripts/run-phase-e2e.sh` only for the phase-final E2E slice and verify scenario-ID traceability across all test levels.
8. The `pre-commit` hook also runs `.github/skills/deterministic-verification/scripts/check-role-scope.sh`, which fails closed if an Engineer report is present alongside a changed `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, `docs/prd/**`, `docs/plans/phases/**`, or `AGENTS.md` file. This does not replace the `Engineer`/`onboard-project` scope boundaries; it is a backstop for the case where a report exists but scope was still violated. It cannot detect an Engineer dispatch that skipped the report protocol entirely.

## Script Execution On Windows

- On Windows, bash scripts must default to Git Bash first instead of invoking `bash` directly as a Windows command. Running bare `bash` on Windows resolves to the Microsoft Store / WSL stub `bash.exe` and fails when WSL is unconfigured.
- Locate Git Bash: check `C:\Program Files\Git\bin\bash.exe`, standard install paths (`C:\Program Files (x86)\Git\bin\bash.exe`, `%LOCALAPPDATA%\Programs\Git\bin\bash.exe`), or resolve from `git.exe` (e.g. `(Get-Command git.exe).Source -replace 'cmd\\git\.exe','bin\bash.exe'`).
- Execute in PowerShell: `& "C:\Program Files\Git\bin\bash.exe" .github/skills/deterministic-verification/scripts/<script>.sh [args]`, or run the corresponding task in `.vscode/tasks.json`.
- On POSIX platforms (Linux/macOS): execute scripts directly (`./.github/skills/deterministic-verification/scripts/<script>.sh [args]`) or via `bash`.

## Fail-Closed Rules

- Missing or invalid reports block completion. Validator returns machine-readable JSON error payloads (e.g. `ERR_MISSING_REPORT`, `ERR_MISSING_RED_EVIDENCE`, `ERR_UNKNOWN_PROPERTIES`).
- Behavior slices missing required Red evidence or lacking a test-bearing unit verification command fail validation and block completion.
- Non-behavior slices without an explicit justification reason fail validation and block completion.
- A mismatch between the report's `changedFiles` and Git's change set blocks completion with machine-readable error `ERR_CHANGE_SET_MISMATCH` including `details.missingFromReport` and `details.notInWorktree`. This supports uncommitted work but requires multiple slices or unrelated edits to be committed, isolated, evaluated from a known baseline, or explicitly reconciled as one scope.
- Unknown boundary classification requires integration.
- Missing project-specific verification commands is an error; this repository does not assume a stack.
- Missing QA approval, scenario-ID mappings, or approved exception reasons blocks the final integration/E2E slice.
- Engineer B may change integration tests and minimal harness code only. Behavior fixes return to Engineer A.
- An Engineer report present alongside a changed product-truth file (see step 8) blocks the commit until reverted or reconciled through the owning skill.
- On Windows, invoking bare `bash` instead of Git Bash is an error; all bash scripts must run through Git Bash or configured VS Code tasks.

## Durable Artifacts

Policies live under `.github/skills/deterministic-verification/policies/`, report contracts under `.github/skills/deterministic-verification/schemas/`, templates under `.github/skills/deterministic-verification/templates/`, and executable enforcement under `.github/skills/deterministic-verification/scripts/` and `.github/skills/deterministic-verification/hooks/`. Local setup readiness is enforced by `.github/skills/deterministic-verification/scripts/bootstrap-deterministic-verification.sh`. Ownership is documented in `.github/skills/deterministic-verification/OWNERSHIP.md`. Do not create a session status artifact.

## Exit

Report the gate JSON, required pass, verification command/result, and any remaining risk. Keep the report concise; the scripts and plan are authoritative.
