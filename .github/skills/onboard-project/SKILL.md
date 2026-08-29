---
name: onboard-project
description: "Assess repository state and sequence the owning skills, including missing or stale workflow artifacts."
argument-hint: "Ask to onboard this repo, or name the subtree to scope discovery to"
user-invocable: true
---

# Onboard Project

The entry point to the workflow. Detect what the repository actually contains, then sequence the owning skills so the user never has to work out the order themselves.

This skill writes no durable artifact of its own. It detects, routes, and supplies the repo-grounded discovery step that no other skill owns.

## When To Use

Whenever starting or resuming work on a repository that is not already in the steady-state loop. It handles an empty directory, a bare scaffold, and a mature codebase alike, so the user does not need to classify the repository before invoking it.

Do not use it when only one artifact is missing and the rest are current — call that owning skill directly.

## Detect First

Read-only. Establish two independent facts before routing.

**Code maturity**

| Signal | State |
| --- | --- |
| No manifest anywhere (`*.sln`/`*.csproj`, `package.json`, `pyproject.toml`, `go.mod`) | `empty` |
| Manifest present, but source is only template output | `scaffold` |
| Manifest plus real source and/or tests | `mature` |

**Test-suite maturity** (only relevant once code maturity is `mature`) — whether a real unit test suite exists, versus no tests at all, and which test framework and commands it uses. This drives the `mutation-testing` offer in Rule 4 and is independent of code maturity: a mature codebase can still have zero tests.

**Artifact maturity** — presence and currency of `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, `docs/prd/`, `docs/plans/`, and `AGENTS.md`.

Also record the detected **stack** from the manifest, and whether a code style config exists and is actually enforced.

## Rule 1: Resolve Competing Instruction Files First

Blocking and mechanical. Before any skill runs:

- `AGENT.md` (singular) must be renamed to `AGENTS.md`. Never leave both.
- If both `AGENTS.md` and `.github/copilot-instructions.md` exist, ask which is canonical and remove the other. `agent-instructions` will stop and ask anyway; resolving it here avoids a wasted run.

Treat any pre-existing `AGENTS.md` as unverified evidence to reconcile, not as truth. It was written without a PRD or plan and may assert conventions the code no longer follows.

## Rule 2: Route By Code Maturity

**`empty`** — the stack is unknown, so no style adapter can run and nothing can be verified. Order:

1. `brain-storm` (pure interview; no discovery to do)
2. `prd-writer` — this is where the stack and target architecture get settled
3. `work-planner` — Phase 0 must be a scaffolding phase
4. Execute the scaffolding slice via `Orchestrator`, run as the active agent mode (switch to it directly), never invoked through a subagent-dispatch tool — it needs `agent`/`execute` tool parity to dispatch `Engineer` and verify. `Orchestrator` dispatches the actual scaffolding to `Engineer` — it must not write product files itself.
5. Style adapter (see Rule 3), now that something is buildable
6. `agent-instructions`

The empty-repository path is not onboarded when scaffolding alone passes. The style adapter and `agent-instructions` steps remain required after the scaffold exists; do not report onboarding complete while either is deferred.

Tell the user to `git init` and add a stack-appropriate ignore file first. No skill owns that, and `conventional-commit` needs a repository.

Before executing the first scaffolding slice in an empty repository, establish a clean Git baseline containing the onboarding artifacts created so far, while leaving the planned slice files uncommitted. Do this as the primary agent or user, never by dispatching it to `Engineer`.

**`scaffold`** — the stack is known and the style backlog is near zero. Order:

1. Style adapter at blocking severity, committed on its own
2. `brain-storm` -> `prd-writer` -> `work-planner`
3. `agent-instructions`

Running the style adapter first is the point: this is the cheapest moment the repository will ever offer, and it strips the settings the project template emitted before they spread.

**`mature`** — run discovery, and treat the style backlog as plan work. Order:

1. Style adapter at non-blocking severity, to measure the violation count without blocking anyone
2. Discovery per [references/DISCOVERY-CHECKLIST.md](references/DISCOVERY-CHECKLIST.md)
3. Mutation-testing offer per Rule 4, handing its result to `work-planner` alongside the violation count
4. `brain-storm` -> `prd-writer` -> `work-planner`, handing the planner the violation count so remediation becomes real phases
5. `agent-instructions`

## Rule 3: Dispatch The Style Adapter By Stack

Match the detected stack to its adapter, which applies [`code-style/protocol.md`](../code-style/protocol.md):

| Stack evidence | Adapter |
| --- | --- |
| `*.sln`, `*.csproj` | `dotnet-editorconfig` |
| `package.json` | none yet |
| `pyproject.toml` | none yet |

If no adapter exists for the detected stack, say so plainly and stop that step. Do not improvise a configuration; report the gap so an adapter can be added.

## Rule 4: Offer Mutation Testing; Never Enable It Unasked

Mutation testing is opt-in per [`mutation-testing/references/PROTOCOL.md`](../mutation-testing/references/PROTOCOL.md), and there are no per-stack adapters — `/mutation-testing` works with whichever tool the user selects. Only relevant once code maturity is `mature`; `empty` and `scaffold` defer per the protocol's repository maturity paths, with no action needed here.

For a `mature` repository, branch on test-suite maturity:

- **No test suite at all** — do not offer a run. Report the gap to `work-planner` as a required prerequisite phase (a baseline test suite) that must land before any mutation-testing phase can start.
- **Existing test suite** — tell the user mutation testing is available, state the cost trade-off plainly, and let them decide whether to run `/mutation-testing` now. Do not configure a tool, pick a tool, or start a run on their behalf, and do not treat silence as consent. Report the outcome (enabled, declined, or deferred) to `work-planner` as backlog context alongside the style violation count.

## Rule 5: Ground The Product Skills In Evidence

For a `mature` repository, discovery produces a disposable findings draft: candidate problem/users/workflow, current architecture and stack, apparent conventions, glossary candidates, contradictions and unknowns.

Hand it to `brain-storm` as pre-filled context. The interview confirms or corrects the draft and resolves genuine ambiguity; it does not re-ask what discovery already answered. Wait for `CONTEXT.md` and `UBIQUITOUS-LANGUAGE.md` before continuing.

For `prd-writer`, the target state of an existing project is normally "current architecture as confirmed" plus explicitly requested changes; ask what should change versus stay before it writes. For `work-planner`, expect most existing behavior to land as already-implemented foundation phases.

If discovery contradicts the stated purpose, surface the contradiction and let the user resolve it before anything is written.

## Rule 6: `agent-instructions` Runs Last, Once

It needs context, PRD, plan, and the enforced style config as inputs, so it runs at the end regardless of path. Choose bootstrap or amendment mode from detection, and fold the style adapter's handoff text into the same run rather than amending twice.

## Rule 7: Report The Test Stack, Do Not Choose It

Record the detected test framework, test-double approach, focused-run command, and full-suite command, and hand them to `agent-instructions` so `AGENTS.md` carries them. Where a repository has no tests yet, leave the choice open: the framework is settled with the user by [`tdd`](../tdd/SKILL.md) at the first behavior change, not guessed here.

## Boundaries

- Never write `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, the PRD, plan artifacts, `AGENTS.md`, or style configuration directly. Always delegate to the owning skill.
- Never delegate `brain-storm`, `prd-writer`, `work-planner`, `agent-instructions`, or code style / mutation-testing setup to `Engineer` or any other subagent. Run each directly in the primary conversation, turn by turn with the user; a stateless subagent cannot hold the interview these skills require, and compressing it into one dispatched brief is not equivalent to running it.
- Do not skip a downstream skill's interview because discovery produced a draft; the draft narrows questions, it does not replace confirmation.
- Do not scaffold projects or choose a directory layout. That is a `prd-writer` target-architecture decision, and letting a scaffolding tool pick it silently overwrites a deliberate choice.
- If the repo is too large for full discovery, scope to a confirmed subtree rather than sampling randomly.
- Re-running this skill is a no-op for any step whose artifact is already current.

## Exit

Onboarding is complete only when the selected routing sequence has actually run and its required artifacts exist at their canonical paths. In particular, `agent-instructions` must be recorded as run and a root `AGENTS.md` must exist (unless the user explicitly requested a scoped instruction file); do not infer completion from the presence of `.github/agents/` definitions or from an `AGENTS.md` mentioned in a handoff.

Return a brief listing: detected code and artifact maturity, detected stack and test stack, instruction-file conflicts resolved, key discovery findings and unresolved contradictions, which skills ran, whether mutation testing was enabled, declined, or deferred, and which artifacts were created or updated. If a required step or artifact is missing, report onboarding as blocked and name the exact next owning skill; do not report the repository as onboarded. The written artifacts are durable; this brief is disposable.
