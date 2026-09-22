# Product Requirements Document

## Relationship To Context
- [CONTEXT.md](../verification-mcp-server/CONTEXT.md) remains the canonical domain-language artifact for problem, users, workflow, and vocabulary.
- [UBIQUITOUS-LANGUAGE.md](../verification-mcp-server/UBIQUITOUS-LANGUAGE.md) remains the canonical glossary; terms below are used as defined there.
- This document defines the target state to build; it does not describe current repo state.

## Target Outcome
- Once v1 coding is done, a standalone `Verification MCP Server` exists as an installed Node.js/TypeScript package that any MCP client launches over stdio.
- A `Coding Agent` drives a complete `Slice` - `Boundary Classification`, `Verification Command` execution, `Engineer Report` production and validation, `Integration Gate` evaluation, and `Review Report` emission - through typed tool calls only, with no shell invocation and no reading of skill prose to decide what comes next.
- Every evidence field and outcome status in an `Engineer Report` or `Review Report` is captured or derived by the server; no such field is authored by an agent.
- Deterministic verification policy exists once, in TypeScript, and the bash scripts under `.github/skills/deterministic-verification/scripts/` no longer exist as the executable contract.
- The same core is reachable from a command-line surface so Git hooks, continuous integration, and editor tasks execute identical policy.

## Requirements And Behaviors

### Server Surface And Invocation
- The server must expose deterministic verification as typed MCP tools over JSON-RPC on stdio.
- Every tool must accept an explicit `repo_path` naming the `Repository Root`, and must never infer it from the process working directory.
- Every tool must declare a machine-readable input schema so argument shape is discoverable rather than guessed.
- Malformed or unknown tool arguments must be rejected as protocol-level invalid-parameter errors before any command, file read, or file write occurs.
- A `repo_path` that is absent, outside a Git repository, or lacking the required workflow artifacts must produce a stable diagnostic category naming the missing precondition.
- A failed tool call must leave the server usable; subsequent valid calls must proceed normally.

### Workflow Position And Next Action
- The server must derive current workflow position on every call from `.workflow/` and `out/` artifacts in the named repository; those artifacts remain the only authoritative state.
- The server must not hold in-memory or persisted session state separate from repository artifacts.
- The server must report a single legal `Next Action` for the current position, with the inputs it requires.
- When artifacts are mutually inconsistent or position cannot be determined, the server must refuse to name a `Next Action` and must report the specific inconsistency.

### Boundary Classification
- The server must classify the changed files of a `Slice` and report whether an integration boundary is crossed.
- Unknown or unclassifiable files must be reported as requiring integration.
- Classification must report the per-file basis for its result so an operator can audit it.

### Verification Execution And Evidence Capture
- The server must execute the project-supplied `Verification Command` and capture its exit code and output as evidence.
- The server must never invent, substitute, or default a `Verification Command`; an absent command is an error.
- Command execution must avoid shell interpretation and must behave identically on Windows and POSIX hosts.
- Execution must enforce a bounded timeout and must distinguish timeout from non-zero exit in its diagnostic category.
- Captured evidence must be attributable to the exact command, `Slice`, and `Pass` that produced it.

### Report Validation
- The server must validate an `Engineer Report` against its contract fail-closed: a missing, unparsable, or schema-violating report blocks completion.
- Validation must reject unknown properties.
- A behavior `Slice` missing required Red evidence, or whose unit `Verification Command` bears no tests, must fail validation.
- A non-behavior `Slice` without an explicit justification reason must fail validation.
- Every validation failure must return a stable machine-readable error identifier and the offending location.

### Integration Gate And Review Reporting
- The `Integration Gate` must reconcile the report's changed files against the Git change set and block on mismatch, naming both files missing from the report and files not in the working tree.
- The gate must state whether `Pass B` is required, and `Pass B` scope must be limited to integration targets.
- The server must write a `Review Report` whose gate result, outcome status, captured evidence, and `Next Action` are derived by the server.
- The server must reject any attempt to supply evidence or outcome status as tool input.
- A blocked gate must leave repository artifacts other than the `Review Report` unchanged.

### Artifact Contract
- Phase and slice artifacts must carry YAML frontmatter holding machine-readable fields, with prose retained in the document body.
- The server must read machine-readable fields only from frontmatter and must not parse prose to derive them.
- Missing or malformed frontmatter must be a fail-closed error naming the artifact and field.

### Command-Line Surface
- A command-line surface must expose the same core operations as the MCP tools with identical policy outcomes.
- Every entry point must support `--help` describing its arguments.
- The command-line surface must exit non-zero on any blocked or failed outcome so hooks and continuous integration fail closed.

## Scope Refinements And Non-Goals
- Refinement beyond the context guardrails: the server is delivered as an installed package registered per MCP client; copying `.github/` is not a supported delivery mode.
- Refinement beyond the context guardrails: fail-closed error identifiers are part of the public contract and must remain stable across the MCP and command-line surfaces.
- Out: agent-authored evidence or outcome status fields.
- Out: automated migration tooling for legacy workflow artifacts; existing artifacts are upgraded by hand and new repositories re-onboard.
- Out: session state held outside repository artifacts.
- Deferred: hosting the server over any transport other than stdio.

## Target Architecture And Constraints
- Target architecture direction: a layered package mirroring the `git-mcp-server` convention - a transport layer owning MCP server and stdio lifecycle, a tools layer owning schemas and handlers, a policy core owning classification, validation, gating, and status derivation, a runner owning command execution and evidence capture, an artifact layer owning `.workflow/` and `out/` reads and writes, and typed models shared across them.
- Required boundaries: the policy core must be transport-agnostic and must be the single implementation shared by the MCP tools and the command-line surface; tool handlers and the command-line surface must contain no policy decisions.
- Required boundaries: only the runner executes external commands; only the artifact layer touches the filesystem.
- Fixed platform or stack constraint: Node.js with strict-mode TypeScript, ESM modules, and the repository's existing MCP SDK, lint, format, and native test-runner stack.
- Hard constraint: command execution uses direct executable invocation with argument arrays, never a shell string.
- Hard constraint: `.workflow/` and `out/` artifacts remain authoritative state; the server is stateless between calls.
- Hard constraint: policy must have exactly one implementation; no bash script may remain as a parallel source of truth.

## Acceptance Signals
- The target is met when a `Coding Agent` completes a full `Slice` - classification, verification run, validated `Engineer Report`, gate evaluation, and `Review Report` - using only typed tool calls, with zero bash invocations.
- The target is met when the server names the legal `Next Action` at each position without the agent consulting skill prose.
- The target is met when a report supplying an evidence or outcome status field is rejected, and the resulting `Review Report` still carries server-derived status.
- The target is met when a missing report, an unknown property, missing Red evidence on a behavior `Slice`, an unjustified non-behavior `Slice`, a changed-file mismatch, an unclassifiable file, and an absent `Verification Command` each block with a stable machine-readable error identifier.
- The target is met when a blocked or failed outcome leaves repository state otherwise unchanged and the server usable for the next call.
- The target is met when the same scenarios produce identical outcomes through the command-line surface and exit non-zero, on both Windows and POSIX hosts.
- The target is met when the package's own verify and test gates pass with zero type, lint, and format violations.

## Planner Assumptions
- `work-planner` may assume the server is an isolated package under `packages/` with its own manifest, TypeScript configuration, and source tree, following the `git-mcp-server` layout.
- `work-planner` may assume Git is installed and on PATH on the host.
- `work-planner` may assume tests may create ephemeral Git repositories and workflow artifact fixtures in temporary directories.
- `work-planner` may assume retiring the bash scripts and migrating existing workflow artifacts to YAML frontmatter is in scope for v1 and must be sequenced after the TypeScript policy core reaches parity.
- `work-planner` may assume the fail-closed rules and report contracts currently expressed under `.github/skills/deterministic-verification/` define required v1 behavior, and that the schemas are re-expressed as typed contracts in the package.
