# Phase 01 - Scaffolding & Git Execution Engine

- **Phase objective:** Establish the standalone package workspace in `packages/git-mcp-server`, configure strict TypeScript compilation, ESLint flat config, Prettier, and implement a robust, secure `GitExecutor` with native `node:test` test coverage against real Git repository fixtures.
- **User-visible outcome:** The `packages/git-mcp-server` package compiles cleanly, executes `npm run verify` without errors or warnings, and exposes a functional MCP stdio server entry point capable of connecting to clients and executing low-level Git commands safely.
- **Backend/data scope:** `packages/git-mcp-server/package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `src/index.ts`, `src/git/executor.ts`, `src/git/types.ts`, `src/git/errors.ts`, `test/git/executor.test.ts`.
- **UI/workflow scope:** MCP JSON-RPC protocol over stdio using `@modelcontextprotocol/sdk`.
- **Cross-slice invariants:**
  - Zero arbitrary shell execution: all Git operations must invoke `git` via `child_process.execFile` with argument arrays.
  - Strict TypeScript with ESM module resolution (`"type": "module"`, Node 22+ target).
  - Cross-platform path normalization (convert backslashes to forward slashes for internal git comparisons).
  - Every execution must support timeout cancellation and non-zero exit code classification.
- **Prerequisites:** Host environment has Node.js >=22.12.0 and Git installed.
- **Blockers:** None.
- **Acceptance checks:**
  - `npm --prefix packages/git-mcp-server run verify` runs `tsc`, `eslint`, and `prettier` checks and passes with 0 errors/warnings.
  - `npm --prefix packages/git-mcp-server test` executes unit tests against temporary repository fixtures with 100% passing tests.
  - Server process starts and answers MCP initialization handshake over stdio.
- **Useful-if-stopped statement:** Provides a verified, reusable, and secure Node.js Git execution library and base MCP server shell even before individual high-level tools are wired up.
- **Risks and mitigations:**
  - Risk: Git executable name or path lookup differs on Windows (`git.exe`).
  - Mitigation: Let `child_process.execFile("git", ...)` rely on system PATH resolution and verify existence during startup.
- **Test checkpoints:**
  - `test/git/executor.test.ts` validates version query, git root detection, timeout cancellation, and exit code error mapping.
- **Definition of done:** All 3 slices completed, `verify` passes, and Phase 01 integration tests prove stdio server initialization and Git execution.

## Slice order

1. [Slice 01 - Package and toolchain setup](slice-01-package-toolchain-setup.md)
2. [Slice 02 - GitExecutor engine & error handling](slice-02-git-executor-engine.md)
3. [Slice 03 - Server bootstrap & execution verification (integration/E2E)](slice-03-server-bootstrap-integration.md)
