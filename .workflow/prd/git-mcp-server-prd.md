# Product Requirements Document

## Relationship To Context
- [CONTEXT.md](../CONTEXT.md) remains the canonical domain-language artifact for problem, users, workflow, and vocabulary.
- This document defines the target state to build; it does not describe current repo state.

## Target Outcome
- Once v1 coding is done, a standalone Model Context Protocol (MCP) server exists in `packages/git-mcp-server` running on Node.js (>=22.12.0) with TypeScript.
- Any MCP-compliant client can launch the server over stdio and execute typed, validated Git operations safely without spawning arbitrary shell strings.
- All Git executions run via direct executable invocation (`child_process.execFile`) with typed argument arrays, completely eliminating shell injection and cross-platform quoting issues across Windows and POSIX systems.
- Results from Git operations return structured JSON data models for status, diffs, log entries, and repository metadata, alongside clear error diagnostics.

## Requirements And Behaviors

### Core Server Infrastructure & Execution
- The server must initialize an MCP server using `@modelcontextprotocol/sdk` and listen on standard input/output (`StdioServerTransport`).
- The execution engine must invoke the host's `git` executable using `child_process.execFile` with explicit argument arrays, bypassing shell interpreters (`cmd.exe`, `powershell.exe`, `/bin/sh`).
- Path handling must resolve relative paths against the resolved repository root and normalize directory separators across Windows and POSIX systems.
- Command executions must enforce configurable timeouts (default 15 seconds) to prevent hanging processes on unexpected lock contention or prompts, returning stable diagnostics that distinguish timeouts from standard command errors.
- All tool input parameters must be validated with schemas before command dispatch: malformed requests must return MCP `InvalidParams` protocol errors without executing subprocesses.
- When domain preconditions or Git commands fail (e.g. non-git directory, empty commit, path outside repository), the tool must return an actionable tool error result (`isError: true`) without terminating the server process.
- Rejected or failed mutations must guarantee state preservation: working tree contents, staging index, and commit history must remain unaltered.
- A failed tool call must not impair or terminate the server connection; subsequent valid tool calls must proceed normally.

### Inspection & Read-Only Tools
- `git_status`:
  - Must return structured working tree and staging area state.
  - Must support porcelain parsing to yield exact two-character status codes (`XY`), staged status, unstaged status, and normalized file paths.
  - Must accept optional flags for `untracked_files` (`all`, `normal`, `no`) and `ignored`.
- `git_diff`:
  - Must support diffing working tree against index, index against HEAD (`staged: true`), or arbitrary commit/branch references.
  - Must support output modes: `patch` (full unified diff), `stat` (file summary with insert/delete counts), `name_only` (list of changed files), and `check` (whitespace/conflict error detection).
  - Must accept path filtering to scope diffs to specific files or directories.
- `git_log`:
  - Must retrieve commit history with structured parsing into commit objects (`hash`, `author`, `date`, `subject`, `body`, `files_changed`).
  - Must accept pagination and scope parameters: `max_count`, `oneline`, `paths`, and `revision_range`.
- `git_info`:
  - Must return core repository metadata: absolute root directory path (`rev-parse --show-toplevel`), current branch name, current commit SHA, remote origin URL (if configured), and `is_clean` boolean.

### Staging & Mutation Tools
- `git_stage`:
  - Must stage specific file paths into the index (`git add -- <paths>`).
  - Must support staging all modified/untracked files (`all: true`).
  - Must validate that target paths exist within the repository boundaries.
- `git_unstage`:
  - Must remove specified files from the staging index without discarding disk modifications (`git restore --staged -- <paths>`).
- `git_restore`:
  - Must discard working directory modifications for explicitly specified paths (`git restore -- <paths>`).
  - Must reject broad unrestrained wildcards without explicit confirmation safeguards to prevent accidental data loss.
- `git_commit`:
  - Must record staged changes with a required subject message and optional body and footers.
  - Must enforce that the staging index contains changes before attempting commit (preventing unintended empty commits unless explicitly overridden).
  - Must support amending the previous commit (`amend: true`).

### Workspace & Branch Management Tools
- `git_branch`:
  - Must support actions: `list`, `create`, `delete`.
  - Must return structured list of local and remote branches including current active branch indicator.
- `git_stash`:
  - Must support actions: `list`, `push`, `pop`, `drop`.
  - Must parse stash entries into structured list with index, branch, and descriptive message.
  - Must support optional `include_untracked` flag during `push`.

## Scope Refinements And Non-Goals
- Refinement beyond context guardrails: Tool operations are strictly non-interactive; any git operation that triggers an interactive terminal prompt (such as merge conflict prompts, credential prompts, or pagers) must be invoked with flags disabling interaction (`GIT_TERMINAL_PROMPT=0`, `--no-pager`).
- Out: Handling interactive rebase (`git rebase -i`), interactive add (`git add -p`), or merge conflict resolution editor sessions.
- Out: Storing or managing remote Git credentials (SSH passphrases, HTTPS tokens).
- Out: Arbitrary raw `git <raw-args>` passthrough endpoint.

## Target Architecture And Constraints
- Target architecture direction: Layered architecture within `packages/git-mcp-server`:
  - `transport/`: MCP server instance and stdio transport lifecycle.
  - `tools/`: Schema definitions and handler dispatchers for each registered MCP tool.
  - `git/`: Low-level executor wrapping `child_process.execFile`, argument serialization, and output stream parsing.
  - `models/`: TypeScript interfaces and validation schemas for inputs, outputs, and status entities.
- Required boundaries: Tool handlers must never invoke `child_process` directly; all Git invocations must pass through the centralized `GitExecutor` which handles timeout, error mapping, and path normalization.
- Fixed platform or stack constraint: Node.js (>=22.12.0 LTS), TypeScript strict mode, ESM module system (`"type": "module"`), native `node:test` test runner.
- Code quality & formatting: Root-aligned ESLint flat config (`eslint.config.js`), Prettier (`.prettierrc`), and single `npm run verify` gate script.

## Acceptance Signals
- The target is met when:
  - `npm --prefix packages/git-mcp-server run verify` succeeds with zero TypeScript errors, zero ESLint warnings, and zero Prettier diffs.
  - `npm --prefix packages/git-mcp-server test` executes unit and integration tests covering all registered tools using `node:test` against temporary local git fixtures.
  - An MCP inspector or client can connect via stdio to the built server and successfully perform an inspect -> stage -> commit -> log loop.
  - Malformed tool requests return protocol errors (`InvalidParams`) without dispatching commands.
  - Safety-rejected mutation requests return actionable errors (`isError: true`), preserve repository state, and leave the server fully operational for subsequent tool calls.

## Planner Assumptions
- `work-planner` may assume `packages/git-mcp-server` is an isolated package with its own `package.json`, `tsconfig.json`, and source tree.
- `work-planner` may assume the Git CLI binary (`git`) is installed on the host system and available on system PATH.
- `work-planner` may assume test suites can create ephemeral local Git repositories in temporary system directories (`node:os.tmpdir()`) to verify tool behaviors deterministically.
