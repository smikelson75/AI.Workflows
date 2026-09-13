# Git MCP Server implementation plan

## Problem and approach
- AI coding agents executing raw shell git commands suffer from shell escaping hazards, platform differences, and unparsed text outputs.
- We are building a standalone TypeScript/Node.js Model Context Protocol (MCP) server in `packages/git-mcp-server` that exposes 10 structured, schema-validated Git tools over stdio.
- Implementation progresses in vertical phases: establishing the core package toolchain and safe `GitExecutor`, followed by inspection tools, staging/mutation tools, and branch/stash management with end-to-end client verification.

## Current state and gap
- Project type: TypeScript / Node.js MCP server package.
- Maturity: Phase 01 completed; core package, toolchain, and Git execution engine operational.
- Architecture direction in place: Layered architecture (`transport/`, `tools/`, `git/`, `models/`), `child_process.execFile` execution engine, schema validation with `@modelcontextprotocol/sdk`.
- Implemented areas: Package toolchain (`package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`), `GitExecutor` safe execution engine, error hierarchy, and `GitMcpServer` stdio bootstrap with handshake tests.
- In-progress areas: Phase 02 inspection and read-only tools.
- Absent areas required by the PRD target: Inspection tools (`git_status`, `git_diff`, `git_log`, `git_info`), mutation tools (`git_stage`, `git_unstage`, `git_restore`, `git_commit`), branch/stash tools, full integration tests.
- Known constraints: Node.js (>=22.12.0 LTS), TypeScript strict mode, native `node:test` test runner, zero shell interpolation.
- Readiness: Phase 01 verified and passing; ready to execute Phase 02 Slice 01.
- Assumptions: Host system has `git` CLI available on PATH. Ephemeral test repositories can be created in temporary directories.

## Active work
- **Current phase:** [Phase 02 - Inspection & Read-Only Tools](phases/phase-02/phase.md)
- **Next slice:** [Slice 03 - Inspection tools integration & E2E verification](phases/phase-02/slice-03-inspection-integration.md)
- **Blockers:** None

## Phase plan

| # | Phase | Status | QA review | Acceptance | Outcome | Detail |
|---|-------|--------|-----------|------------|---------|--------|
| 01 | Scaffolding & Git Execution Engine | completed | approved | `phases/phase-01/acceptance.feature` | Runnable TypeScript package with safe `GitExecutor` and stdio server harness | [detail](phases/phase-01/phase.md) |
| 02 | Inspection & Read-Only Tools | in progress | pending | `phases/phase-02/acceptance.feature` | `git_status`, `git_diff`, `git_log`, and `git_info` tools registered with structured models | [detail](phases/phase-02/phase.md) |
| 03 | Staging & Mutation Tools | planned | pending | `phases/phase-03/acceptance.feature` | `git_stage`, `git_unstage`, `git_restore`, and `git_commit` tools with safety safeguards | [detail](phases/phase-03/phase.md) |
| 04 | Branch, Stash & E2E Validation | planned | pending | `phases/phase-04/acceptance.feature` | `git_branch`, `git_stash`, and end-to-end agent workflow verification | [detail](phases/phase-04/phase.md) |

## Slice status - Phase 02

| # | Slice | Status | Detail |
|---|-------|--------|--------|
| 01 | git_status & git_info tools | completed | [detail](phases/phase-02/slice-01-git-status-info.md) |
| 02 | git_diff & git_log tools | completed | [detail](phases/phase-02/slice-02-git-diff-log.md) |
| 03 | Inspection tools integration & E2E verification (integration/E2E) | planned | [detail](phases/phase-02/slice-03-inspection-integration.md) |
