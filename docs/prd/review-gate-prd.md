# Product Requirements Document

## Relationship To Context

- [`CONTEXT.md`](../../CONTEXT.md) remains the canonical domain-language artifact for problem, users, workflow, scope guardrails, and vocabulary.
- This document defines the Review Gate target state; it does not describe current repository state.

## Target Outcome

- The Review Gate blocks completion of every Engineer Slice until its scoped review has no unresolved Findings.
- Developers decide every Finding with enough evidence to distinguish a one-time correction, a durable Rule, and an acceptable exception.
- Active Rules are independently readable and their full contents are loaded only when the Engineer Slice plausibly matches their metadata.

## Requirements And Behaviors

### Rule Catalog

- The system must store every active Rule in a separate human-readable Markdown file with YAML frontmatter.
- Rule Metadata must include `id`, `title`, `status`, `scope`, `triggers`, and `summary`; it may include `language` and `tags`.
- The JavaScript Rule Catalog must validate Rule Metadata and expose the compact metadata set without loading Rule bodies.
- A `subagentStart` hook must call the Rule Catalog and inject compact Rule Metadata into the Review Subagent's prompt before it runs.
- A `preToolUse` hook must call the Rule Catalog to load a full Rule's body and record the loaded Rule ID for that review session; the Review Subagent must not load Rule bodies directly.
- A `subagentStop` hook must inspect the Review Subagent's final response and block completion, forcing another turn, when a reported Finding cites a Rule ID that was not recorded as loaded for that session.
- If an active Rule cannot be parsed, validated, or loaded, the Review Gate must block the Engineer Slice and surface the configuration failure.

### Scoped Review

- The Review Subagent must review the Engineer Slice diff and directly affected Construction Paths.
- It must use Rule Metadata to select plausible Rules, then evaluate only the loaded full Rules.
- It must deliver all Findings from one review in one numbered decision report.
- A review with no Findings must allow the Engineer Slice to proceed.

### Finding Decisions And Re-Review

- Each Finding must include the relevant location and minimal excerpt, traced Construction Path, candidate Rule, rationale and tradeoffs, alternatives, applicable exceptions, confidence, and repository-wide impact.
- The Developer must be able to choose `Fix Once`, `Adopt Rule and Fix`, or `Dismiss` independently for each Finding.
- `Fix Once` must return a focused revision request to Engineer without creating a Rule.
- `Adopt Rule and Fix` must generate and activate a complete Rule file from the approved Finding, then return the focused revision to Engineer.
- The complete Rule generated at adoption must include decision criteria, rationale, exceptions, examples, review guidance, and required Rule Metadata.
- `Dismiss` must close only the current Finding and must not create a durable Rule exception or suppress later matching Findings.
- After a required Engineer revision, the Review Gate must re-review the revised Engineer Slice before it can complete.

### Decision Journal

- The system must retain one append-only JSON Lines record for every closed Finding.
- Each record must include `ruleId`, `slice`, `location`, `disposition`, and a short `rationale`; an `Adopt Rule and Fix` record must also identify the generated Rule path.
- The Decision Journal must not be included in initial Review Subagent context or ordinary scoped review inputs.

### Seeded Construction Rules

- The initial Rule Catalog must include an active Rule favoring a Simple Constructor for ordinary object creation over an unnecessary Static Factory.
- That Rule must allow a Static Factory when it deliberately selects different values or models named states, such as `Result.Success(data)`, `NotFound()`, and `Failure(error)`.
- The initial Rule Catalog must include an active Complex Constructor Rule for constructors with five or more required parameters, or ambiguous combinations including multiple same-typed values, booleans, or numerous optional values.
- The Complex Constructor Rule must recommend a builder or value object as appropriate, while leaving the Finding disposition to the Developer.

## Scope Refinements And Non-Goals

- Rule adoption produces repository-wide Rules by default.
- v1 does not automatically modify implementation code.
- v1 does not automatically promote a candidate pattern into a Rule.
- v1 does not scan the entire repository for pre-existing rule debt.
- v1 does not suppress repeated patterns because a prior Finding was dismissed.

## Target Architecture And Constraints

- Rules are policy documents; the JavaScript Rule Catalog is the only metadata loading and validation boundary.
- Copilot CLI hooks (`subagentStart`, `preToolUse`, `subagentStop`), not Review Subagent tool calls, invoke the Rule Catalog; Rule loading occurs under deterministic hook-script control rather than agent-reported compliance.
- Review Subagent is a user-defined custom agent; the built-in `general-purpose` agent does not emit the `subagentStart`/`subagentStop` events this design depends on.
- `subagentStop` is the enforcement boundary: it inspects the Review Subagent's final response before Orchestrator receives it and can force another turn independent of Orchestrator's own handling of that response.
- The Review Gate is a required post-Engineer, pre-completion boundary managed through the Engineer Slice workflow.
- The Decision Journal is an append-only JSON Lines audit artifact and remains separate from Rule documents.

## Acceptance Signals

- A slice matching a seeded Rule produces a blocking, evidence-backed Finding and cannot complete until every Finding is decided and any required revision is re-reviewed.
- A Static Factory that deliberately represents a named state is not reported by the Simple Constructor Rule.
- A valid slice that matches no Rule completes without loading unrelated full Rule bodies.
- A malformed active Rule blocks completion with a clear configuration error.
- An adopted Rule has a complete Markdown file, valid metadata, and a compact Decision Journal record.
- A dismissal leaves a compact Decision Journal record and does not alter future Rule evaluation.
- A Finding that cites a Rule ID not recorded as loaded through the hook-enforced path is blocked at `subagentStop`, independent of Orchestrator's own handling of the Review Subagent's report.

## Planner Assumptions

- `review-gate` is the durable artifact slug.
- Both seeded Construction Rules are active in v1.
- The Developer is available to decide combined Findings before a blocked Engineer Slice can proceed.
- The existing Engineer Slice lifecycle is the source of slice identity and revision handoff context.
- Review Subagent is implemented as a user-defined custom agent, not the built-in `general-purpose` agent, because `subagentStart`/`subagentStop` hook events do not fire for `general-purpose`.
- Repository-level Copilot CLI hook configuration (`.github/hooks/*.json`) is available and loaded in every environment the Review Gate runs.
