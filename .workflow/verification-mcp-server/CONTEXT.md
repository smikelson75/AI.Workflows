# Context

## Problem
- Deterministic verification logic lives in bash scripts that agents invoke as terminal strings, so every call depends on correct shell escaping across PowerShell and Git Bash.
- Agents guess flag names and argument shapes because the contract lives in prose, producing invented flags, malformed JSON arguments, and retried invocations.
- The scripts are stateless and mute: they exit pass or fail without reporting workflow position, so agents re-derive the next legal step from prose on every call and sometimes derive it wrong.
- Agents author their own verification evidence and outcome status, making reports testimony rather than captured evidence, which defeats fail-closed verification.

## Users
- `Coding Agent` - Automated AI agent executing a slice, producing evidence, and requesting the next legal action.
- `Orchestrator` - Routing role that evaluates the gate and records status against the plan.
- `Host Application` - MCP client launching the server and routing JSON-RPC stdio calls.

## Workflow
- Client launches the verification server over stdio; every call carries an explicit `repo_path`.
- Agent asks for current workflow position and the single legal next action.
- Agent requests boundary classification for the slice under execution.
- Server executes the project-supplied verification command and captures exit code and output as evidence.
- Server validates the resulting report against fail-closed rules and evaluates the integration gate.
- Server writes a review report whose outcome status is derived from gate result and captured evidence, never asserted by the agent.

## Ubiquitous Language
- See `UBIQUITOUS-LANGUAGE.md` for the canonical glossary.
- `Verification MCP Server` - Model Context Protocol server exposing deterministic verification as typed tools over stdio.
- `Slice` - Smallest dispatched unit of implementation work carrying its own verification command and acceptance checks.
- `Phase` - Ordered group of slices ending in an integration and end-to-end slice.
- `Pass` - A single Engineer execution over a slice; Pass A covers behavior, Pass B covers integration only.
- `Engineer Report` - Structured evidence artifact emitted by a Pass.
- `Integration Gate` - Deterministic evaluation deciding whether Pass B is required.
- `Review Report` - Structured outcome recording gate result, derived status, and next action.
- `Boundary Classification` - Categorisation of changed files determining integration need.
- `Verification Command` - Project-supplied command a runner executes to produce evidence.
- `Next Action` - The single legal operation given current workflow position.

## Scope Guardrails
- in: Standalone TypeScript/Node.js MCP server delivered as an installed package, registered per MCP client.
- in: Verification policy reimplemented in TypeScript as the single source of truth; the bash scripts are retired.
- in: Typed tools for report validation, gate evaluation, boundary classification, verification runs, review reporting, and workflow status.
- in: Explicit `repo_path` per call, mirroring the `git-mcp-server` convention.
- in: Workflow position derived from `.workflow/` and `out/` artifacts on each call; those artifacts remain authoritative.
- in: YAML frontmatter carrying machine-readable fields on phase and slice artifacts, with prose retained in the document body.
- in: A command-line surface over the same core for Git hooks, continuous integration, and editor tasks, including `--help` on every entry point.
- out: Agent-authored verification evidence or outcome status fields.
- out: Automated migration tooling for legacy workflow artifacts; existing artifacts are upgraded by hand and future repositories re-onboard instead.
- out: In-memory or persisted session state separate from repository artifacts.
- out: Self-contained delivery by copying `.github/` without an install step.

## Success
- v1 succeeds when an agent can drive a full slice end to end - classify boundaries, run verification, produce a validated Engineer report, evaluate the integration gate, and write a review report - entirely through typed MCP tool calls with zero bash invocation, and the server reports the legal next action without the agent re-reading skill prose.
- v1 additionally requires that no evidence or outcome status field in any report is authored by the agent; every such field is captured or derived by the server.
