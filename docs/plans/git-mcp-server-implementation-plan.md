# Git MCP Server implementation plan

## Problem and approach
- AI coding agents executing raw shell git commands suffer from shell escaping hazards, platform differences, and unparsed text outputs.
- We are building a standalone TypeScript/Node.js Model Context Protocol (MCP) server in `packages/git-mcp-server` that exposes 10 structured, schema-validated Git tools over stdio.
- Implementation progresses in vertical phases: establishing the core package toolchain and safe `GitExecutor`, followed by inspection tools, staging/mutation tools, and branch/stash management with end-to-end client verification.

## Current state and gap
- Project type: TypeScript / Node.js MCP server package.
- Maturity: New package / greenfield within `packages/git-mcp-server`.
- Architecture direction in place: Layered architecture (`transport/`, `tools/`, `git/`, `models/`), `child_process.execFile` execution engine, schema validation with `@modelcontextprotocol/sdk`.
- Implemented areas: None.
- In-progress areas: Phase 01 scaffolding and execution engine.
- Absent areas required by the PRD target: Package scaffolding, `GitExecutor`, inspection tools, mutation tools, branch/stash tools, integration tests.
- Known constraints: Node.js (>=22.12.0 LTS), TypeScript strict mode, native `node:test` test runner, zero shell interpolation.
- Readiness: Ready to scaffold Phase 01.
- Assumptions: Host system has `git` CLI available on PATH. Ephemeral test repositories can be created in temporary directories.

## Active work
- **Current phase:** [Phase 01 - Scaffolding & Git Execution Engine](phases/phase-01/phase.md)
- **Next slice:** [Slice 02 - GitExecutor engine & error handling](phases/phase-01/slice-02-git-executor-engine.md)
- **Blockers:** None

## Phase plan

| # | Phase | Status | QA review | Acceptance | Outcome | Detail |
|---|-------|--------|-----------|------------|---------|--------|
| 01 | Scaffolding & Git Execution Engine | in progress | approved | `phases/phase-01/acceptance.feature` | Runnable TypeScript package with safe `GitExecutor` and stdio server harness | [detail](phases/phase-01/phase.md) |
| 02 | Inspection & Read-Only Tools | planned | pending | `phases/phase-02/acceptance.feature` | `git_status`, `git_diff`, `git_log`, and `git_info` tools registered with structured models | [detail](phases/phase-02/phase.md) |
| 03 | Staging & Mutation Tools | planned | pending | `phases/phase-03/acceptance.feature` | `git_stage`, `git_unstage`, `git_restore`, and `git_commit` tools with safety safeguards | [detail](phases/phase-03/phase.md) |
| 04 | Branch, Stash & E2E Validation | planned | pending | `phases/phase-04/acceptance.feature` | `git_branch`, `git_stash`, and end-to-end agent workflow verification | [detail](phases/phase-04/phase.md) |

## Slice status - Phase 01

| # | Slice | Status | Detail |
|---|-------|--------|--------|
| 01 | Package and toolchain setup | completed | [detail](phases/phase-01/slice-01-package-toolchain-setup.md) |
| 02 | GitExecutor engine & error handling | planned | [detail](phases/phase-01/slice-02-git-executor-engine.md) |
| 03 | Server bootstrap & execution verification (integration/E2E) | planned | [detail](phases/phase-01/slice-03-server-bootstrap-integration.md) |
