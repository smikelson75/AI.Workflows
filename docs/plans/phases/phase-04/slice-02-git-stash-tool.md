# Slice 02 - git_stash tool

- **User-visible outcome:** MCP clients can isolate in-progress work by saving dirty working-tree state to a stash, listing stash entries, popping a stash back cleanly, and dropping unneeded stash entries via `git_stash`.
- **Backend/data slice:** `packages/git-mcp-server/src/tools/stash/stash.ts`, `packages/git-mcp-server/src/models/workspace.ts`, `packages/git-mcp-server/src/server.ts`.
- **UI/workflow slice:** Registration of `git_stash` on the MCP server with JSON Schema input validation for the `list`, `push`, `pop`, and `drop` actions and structured JSON result serialization.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/models/workspace.ts`
  - `packages/git-mcp-server/src/tools/stash/stash.ts`
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/test/tools/stash/stash.test.ts`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `git_stash` with action `list` returns structured stash entries with index, branch, and descriptive message.
  - `git_stash` with action `push` saves working-tree and index changes, supports an optional `include_untracked` flag, and reports the created stash identifier.
  - `git_stash` with action `pop` applies and removes the target stash entry, surfacing structured conflict diagnostics instead of crashing when the pop cannot apply cleanly.
  - `git_stash` with action `drop` removes the target stash entry without touching the working tree.
  - Invalid or missing input options (unknown action, out-of-range stash index) are rejected with structured validation errors before invoking `GitExecutor`.
  - Unit tests with `node:test` against temporary git fixture repositories verify list/push/pop/drop behavior, `include_untracked`, and conflict-diagnostic reporting on pop.
- **Useful-if-stopped statement:** Equips agents to safely park and restore in-progress work without losing changes.
