---
name: deterministic-verification
description: "Run deterministic integration gating, structured Engineer handoffs, and phase-end E2E verification around agent-executed slices."
argument-hint: "Name a slice, phase, report, or ask to evaluate the integration gate"
user-invocable: true
---

# Deterministic Verification

Use this skill when an implementation slice needs the deterministic integration-gate workflow described in [docs/deterministic-verification-user-guide.md](../../../docs/deterministic-verification-user-guide.md).

## Ownership

- `work-planner` owns slice scope, verification commands, and acceptance checks.
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
7. Run `.github/skills/deterministic-verification/scripts/run-phase-e2e.sh` only for the phase-final E2E slice.
8. The `pre-commit` hook also runs `.github/skills/deterministic-verification/scripts/check-role-scope.sh`, which fails closed if an Engineer report is present alongside a changed `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, `docs/prd/**`, `docs/plans/**`, or `AGENTS.md` file. This does not replace the `Engineer`/`onboard-project` scope boundaries; it is a backstop for the case where a report exists but scope was still violated. It cannot detect an Engineer dispatch that skipped the report protocol entirely.

## Fail-Closed Rules

- Missing or invalid reports block completion.
- A mismatch between the report's `changedFiles` and Git's change set blocks completion. This supports uncommitted work but requires multiple slices or unrelated edits to be committed, isolated, evaluated from a known baseline, or explicitly reconciled as one scope.
- Unknown boundary classification requires integration.
- Missing project-specific verification commands is an error; this repository does not assume a stack.
- Engineer B may change integration tests and minimal harness code only. Behavior fixes return to Engineer A.
- An Engineer report present alongside a changed product-truth file (see step 8) blocks the commit until reverted or reconciled through the owning skill.

## Durable Artifacts

Policies live under `.github/skills/deterministic-verification/policies/`, report contracts under `.github/skills/deterministic-verification/schemas/`, templates under `.github/skills/deterministic-verification/templates/`, and executable enforcement under `.github/skills/deterministic-verification/scripts/` and `.github/skills/deterministic-verification/hooks/`. Local setup readiness is enforced by `.github/skills/deterministic-verification/scripts/bootstrap-deterministic-verification.sh`. Ownership is documented in `.github/skills/deterministic-verification/OWNERSHIP.md`. Do not create a session status artifact.

## Exit

Report the gate JSON, required pass, verification command/result, and any remaining risk. Keep the report concise; the scripts and plan are authoritative.