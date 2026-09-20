# Slice 02 - GitExecutor engine & error handling

- **User-visible outcome:** A core `GitExecutor` component is implemented that runs Git commands via `child_process.execFile` with argument arrays, path normalization, timeout management, and structured error handling, backed by native `node:test` tests.
- **Backend/data slice:** `packages/git-mcp-server/src/git/executor.ts`, `packages/git-mcp-server/src/git/types.ts`, `packages/git-mcp-server/src/git/errors.ts`, `packages/git-mcp-server/test/git/executor.test.ts`.
- **UI/workflow slice:** Programmatic API for executing arbitrary git subcommands safely with typed options (`cwd`, `timeoutMs`, `env`).
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/git/executor.ts`
  - `packages/git-mcp-server/src/git/types.ts`
  - `packages/git-mcp-server/src/git/errors.ts`
  - `packages/git-mcp-server/test/git/executor.test.ts`
  - `packages/git-mcp-server/test/helpers/fixture-repo.ts`
- **Verification command:** `npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `GitExecutor.exec()` successfully executes `git --version` and returns parsed stdout.
  - `GitExecutor.exec()` in a temporary fixture repo discovers repository root via `rev-parse --show-toplevel`.
  - Commands failing with non-zero exit codes throw structured `GitError` containing stderr, exitCode, and executed command arguments.
  - Timeout enforcement aborts hanging processes and throws a descriptive timeout error.
  - No shell is spawned during execution (`shell: false`).
- **Useful-if-stopped statement:** Delivers a secure, standalone Git execution library that can be reused across any CLI or MCP tool integration.
