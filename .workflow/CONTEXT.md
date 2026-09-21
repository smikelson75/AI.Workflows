# Context

## Problem
- AI coding agents in automated execution loops currently rely on raw shell commands (`git status`, `git diff`, `git add`, `git commit`) via terminal/bash execution.
- Shell-based Git interaction suffers from severe escaping bugs across Windows PowerShell and Unix Bash, arbitrary shell injection hazards, unparsed verbose text outputs, and risk of catastrophic unstaged state destruction.
- Agents need structured, typed, and schema-validated tool interfaces to inspect, stage, commit, branch, and stash repository changes safely.

## Users
- `Coding Agent` - Automated AI agent executing task slices, verifying diffs, and journaling conventional commits.
- `Host Application` - VS Code or MCP client orchestrating tools and routing JSON-RPC stdio calls to the server.

## Workflow
- Client launches Git MCP server over stdio.
- Agent discovers repository status and active branch via inspection tools.
- Agent inspects working tree diffs or staged changes with structured filtering.
- Agent stages targeted file paths and executes conventional commits with validated subjects and bodies.
- Agent creates or manages branches and isolated stashes across verification gates.
- Server returns typed JSON-RPC results with structured status codes, diff objects, and deterministic error messages.

## Ubiquitous Language
- See `UBIQUITOUS-LANGUAGE.md` for the canonical glossary.
- `Git MCP Server` - Model Context Protocol server exposing Git operations over stdio.
- `Repository` - Local Git workspace containing a `.git` metadata store and working tree.
- `Tool` - Formally registered MCP JSON-RPC callable function with schema validation.
- `Working Tree` - Directory containing physical files on disk under repository control.
- `Index` - The Git staging area between the working tree and commit history.
- `Commit` - Immutable history entry with SHA, author, timestamp, subject, body, and footers.
- `Diff Patch` - Structured delta representation between commits, index, or working tree.
- `Reference` - Named pointer to a commit (branch or tag) or HEAD.
- `Stash Entry` - Saved snapshot of dirty working tree and staged index state.

## Scope Guardrails
- in: Standalone TypeScript/Node.js MCP server located in `packages/git-mcp-server`.
- in: 10 structured tools across inspection, staging, committing, branching, and stashing.
- in: Safe execution via `child_process.execFile` with argument arrays (zero shell interpolation).
- in: Cross-platform compatibility for Windows, macOS, and Linux (path normalization and CRLF/LF resilience).
- in: Strict TypeScript compilation, ESLint flat config, Prettier formatting, and native `node:test` suite.
- out: Unsanitized raw shell or arbitrary command execution pass-throughs.
- out: Interactive git workflows requiring terminal TTY input (e.g. interactive rebase, interactive add).
- out: Remote credential prompts or authentication secret management.

## Success
- v1 succeeds when an AI agent can execute all 10 core Git operations (status, diff, log, info, stage, unstage, restore, commit, branch, stash) purely via structured MCP tool calls over stdio without invoking raw shell git commands.
