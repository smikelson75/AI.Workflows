# 0001. Enforce Rule loading and citation through Copilot CLI hooks, not agent-reported compliance

Status: Accepted

## Context

- The Review Gate's Target Outcome requires that a `Finding` never cites a Rule whose full body was not actually loaded, and that no Engineer Slice completes with an unresolved `Finding`.
- `Review Subagent` is an LLM agent. Its `.agent.md` contract can *instruct* it to load compact Rule Metadata, then load a full Rule before citing it — but nothing checks that it actually did so. A hallucinated or non-compliant Finding cannot be detected from the agent's own report.
- `Orchestrator` reading and judging `Review Subagent`'s report is still agent-driven trust one layer up: it depends on `Orchestrator`'s contract compliance, not code.
- Copilot CLI supports repository-defined hooks (`.github/hooks/*.json`) that run deterministic shell scripts at fixed lifecycle points, independent of any agent's own instructions. Verified hook events relevant here: `subagentStart` (fires before a subagent runs, can inject `additionalContext` into its prompt), `preToolUse` (fires before any tool call, can allow/deny/substitute arguments), and `subagentStop` (fires when a subagent completes, before its response reaches the parent agent; can `block` and force another turn using the full final response text).
- Confirmed constraint: `subagentStart`/`subagentStop` do not fire for the built-in `general-purpose` agent — only for other built-in YAML agents and user-defined custom agents.

## Decision

- The JavaScript Rule Catalog is invoked from hook scripts, not from `Review Subagent`'s own tool calls: a `subagentStart` hook loads and injects compact Rule Metadata before the subagent runs; a `preToolUse` hook loads a full Rule's body and records the loaded Rule ID for that review session.
- A `subagentStop` hook inspects `Review Subagent`'s final response and blocks completion (forces another turn) whenever a reported Finding cites a Rule ID not recorded as loaded for that session — enforcing the requirement independent of `Orchestrator`.
- `Review Subagent` must be defined as a user-defined custom agent (not the built-in `general-purpose` agent), since the enforcement hooks depend on `subagentStart`/`subagentStop` events that `general-purpose` does not emit.

## Alternatives Considered

- `Agent-instructed loading only` (status quo) - the Review Subagent contract tells it to load metadata then full Rules before citing them. Rejected: compliance is unverifiable: a hallucinated Finding or a skipped load cannot be distinguished from a correct one.
- `Orchestrator-run verifier script` - Orchestrator's own contract requires it to run a Node verifier via its `execute` tool after dispatching Review Subagent, gating completion on the verifier's exit code. Rejected as the primary mechanism: it only moves the trust dependency up one layer, from "Review Subagent behaved" to "Orchestrator remembered to run the verifier and honored its result."
- `general-purpose subagent for Review Subagent` - reusing the built-in general-purpose agent to avoid maintaining a custom agent definition. Rejected: confirmed that `subagentStart`/`subagentStop` do not fire for `general-purpose`, so this hook-based enforcement design would silently not run.

## Consequences

- Rule loading and citation enforcement become independently testable, code-owned behavior (hook scripts calling the Rule Catalog) rather than something provable only by re-reading an agent's prose report.
- The repository gains a new artifact category — `.github/hooks/*.json` plus their scripts — and a new hard constraint that `Review Subagent` cannot be the built-in `general-purpose` agent.
- `preToolUse` command hooks fail closed on a crash/non-zero exit but fail open on a timeout; hook scripts calling the Rule Catalog must stay fast and reliable, or a hang silently bypasses enforcement.
- Session-scoped state (which Rule IDs were loaded) must be tracked across the `preToolUse` and `subagentStop` hook invocations for one review session, adding a small ephemeral artifact beyond the durable Decision Journal.
