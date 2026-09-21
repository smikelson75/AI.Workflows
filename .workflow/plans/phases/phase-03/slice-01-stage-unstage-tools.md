# Slice 01 - git_stage & git_unstage tools

- **User-visible outcome:** MCP clients can stage explicit file paths or all modified/untracked files into the index with `git_stage`, and remove specific files from the index without discarding disk modifications with `git_unstage`.
- **Backend/data slice:** `packages/git-mcp-server/src/tools/mutation/stage.ts`, `packages/git-mcp-server/src/tools/mutation/unstage.ts`, `packages/git-mcp-server/src/models/mutation.ts`, `packages/git-mcp-server/src/server.ts`, `packages/git-mcp-server/test/tools/stage.test.ts`, `packages/git-mcp-server/test/tools/unstage.test.ts`.
- **UI/workflow slice:** Registration of `git_stage` and `git_unstage` tools on the MCP server with JSON Schema input validation and structured JSON result serialization.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/models/mutation.ts`
  - `packages/git-mcp-server/src/tools/mutation/stage.ts`
  - `packages/git-mcp-server/src/tools/mutation/unstage.ts`
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/test/tools/stage.test.ts`
  - `packages/git-mcp-server/test/tools/unstage.test.ts`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `git_stage` stages explicitly listed paths (`git add -- <paths>`) and supports staging all modified/untracked files via an `all: true` option.
  - `git_stage` validates that every requested path resolves strictly within the repository root before executing `git add`, rejecting traversal attempts (e.g. `../`).
  - `git_unstage` requires an explicit, non-empty path list and removes only those paths from the index (`git restore --staged -- <paths>`) without discarding working tree modifications.
  - Both tools reject invalid or missing input options with structured validation errors before invoking `GitExecutor`.
  - Unit tests with `node:test` against temporary git fixture repositories verify selective staging, `all: true` staging, path-boundary rejection, and non-destructive unstaging.
- **Useful-if-stopped statement:** Equips agents to selectively stage and unstage changes safely ahead of committing.
