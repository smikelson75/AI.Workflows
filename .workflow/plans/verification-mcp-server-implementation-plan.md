# Verification MCP Server implementation plan

## Problem and approach
- Deterministic verification policy currently lives in bash scripts invoked as terminal strings, so agents fight shell escaping, guess flag shapes from prose, receive mute pass/fail exits, and end up authoring their own evidence and outcome status.
- We are building a standalone TypeScript/Node.js `Verification MCP Server` in `packages/verification-mcp-server` that exposes deterministic verification as typed MCP tools over stdio, with a command-line surface over the same policy core.
- Delivery is parity-first: build the artifact layer, then the policy core, then the runner and gate, then the MCP and command-line surfaces. The bash scripts are retired in a single cutover only after the TypeScript core has proven parity.
- Phase numbering continues from the completed `git-mcp-server` plan in the shared `phases/` folder.

## Current state and gap
- Project type: multi-package TypeScript / Node.js repository of MCP servers and workflow contracts.
- Maturity: `packages/git-mcp-server` is complete through Phase 04; `packages/verification-mcp-server` does not exist.
- Architecture direction in place: layered MCP package convention proven by `git-mcp-server` (`transport`/`tools`/`git`/`models`), `child_process.execFile` execution with argument arrays, Zod schemas on `@modelcontextprotocol/sdk`, ESM, strict TypeScript, native `node:test`.
- Implemented areas: deterministic verification policy as bash scripts, JSON Schemas, templates, hooks, and VS Code tasks under `.github/skills/deterministic-verification/`; these define required v1 behavior and are the parity reference.
- In-progress areas: none.
- Absent areas required by the PRD target: the verification package itself, YAML frontmatter on phase and slice artifacts, typed policy core, evidence-capturing runner, MCP tool surface, command-line surface, and any TypeScript expression of the fail-closed error identifiers.
- Known constraints: Node.js >= 22.12.0, TypeScript strict mode, ESM, native `node:test`, no shell strings, explicit `repo_path` per call, server stateless between calls with `.workflow/` and `out/` as the only authoritative state.
- Readiness: PRD and ADRs 0002 and 0003 are settled; Phase 05 is execution-ready.
- Assumptions: Git is on PATH; tests may create ephemeral Git repositories and workflow artifact fixtures in temporary directories; the existing schemas under `.github/skills/deterministic-verification/schemas/` are the authoritative parity reference until cutover.

## Active work
- **Current phase:** [Phase 05 - Package Foundation & Artifact Layer](phases/phase-05/phase.md)
- **Next slice:** [Slice 04 - Artifact layer integration and E2E verification (integration/E2E)](phases/phase-05/slice-04-artifact-layer-integration.md)
- **Blockers:** No root mutation-testing adapter config exists in this repository. Phase 05 Slice 01 must establish the StrykerJS configuration via the `stryker-js` skill so the phase-final slice can run phase-scoped mutation testing; if that setup is refused, raise it rather than dropping mutation testing silently.

## Phase plan

| # | Phase | Status | QA review | Acceptance | Outcome | Detail |
|---|-------|--------|-----------|------------|---------|--------|
| 05 | Package Foundation & Artifact Layer | in progress | approved | `phases/phase-05/acceptance.feature` | An installable package that resolves a `repo_path`, reads frontmatter-bearing workflow artifacts, and fails closed with stable error identifiers | [detail](phases/phase-05/phase.md) |
| 06 | Boundary Classification & Engineer Report Validation | planned | pending | `phases/phase-06/acceptance.feature` | Changed files are classified with per-file basis, and Engineer Reports are validated fail-closed against the report contract | [detail](phases/phase-06/phase.md) |
| 07 | Verification Runner, Integration Gate & Review Reporting | planned | pending | `phases/phase-07/acceptance.feature` | Verification commands run with captured evidence, the gate reconciles changed files, and Review Reports carry server-derived status | [detail](phases/phase-07/phase.md) |
| 08 | Workflow Position & MCP Tool Surface | planned | pending | `phases/phase-08/acceptance.feature` | An MCP client drives a full slice over stdio and is told the single legal next action | [detail](phases/phase-08/phase.md) |
| 09 | Command-Line Surface & Parity | planned | pending | `phases/phase-09/acceptance.feature` | Hooks, continuous integration, and editor tasks execute identical policy and fail closed with non-zero exits | [detail](phases/phase-09/phase.md) |
| 10 | Artifact Migration & Script Retirement | planned | pending | `phases/phase-10/acceptance.feature` | Workflow artifacts carry frontmatter, the bash scripts are gone, and the agent loop runs with zero bash invocation | [detail](phases/phase-10/phase.md) |

## Slice status - Phase 05

| # | Slice | Status | Detail |
|---|-------|--------|--------|
| 01 | Package toolchain and verify gate | completed | [detail](phases/phase-05/slice-01-package-toolchain.md) |
| 02 | Repository root resolution and fail-closed error contract | completed | [detail](phases/phase-05/slice-02-repo-root-and-errors.md) |
| 03 | Frontmatter artifact reads | completed | [detail](phases/phase-05/slice-03-frontmatter-artifact-reads.md) |
| 04 | Artifact layer integration and E2E verification (integration/E2E) | in progress | [detail](phases/phase-05/slice-04-artifact-layer-integration.md) |

## Completed plans in this repository
- [Git MCP Server implementation plan](git-mcp-server-implementation-plan.md) - Phases 01-04, completed.
