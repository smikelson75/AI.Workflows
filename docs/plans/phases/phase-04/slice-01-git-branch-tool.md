# Slice 01 - git_branch tool

- **User-visible outcome:** MCP clients can list local and remote branches with the current branch indicated, create new branches, and safely delete existing branches via `git_branch`.
- **Backend/data slice:** `packages/git-mcp-server/src/tools/branch/branch.ts`, `packages/git-mcp-server/src/models/workspace.ts`, `packages/git-mcp-server/src/server.ts`.
- **UI/workflow slice:** Registration of `git_branch` on the MCP server with JSON Schema input validation for the `list`, `create`, and `delete` actions and structured JSON result serialization.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/models/workspace.ts`
  - `packages/git-mcp-server/src/tools/branch/branch.ts`
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/test/tools/branch/branch.test.ts`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `git_branch` with action `list` returns structured local and remote branch entries with a current-branch indicator, via `GitExecutor` only.
  - `git_branch` with action `create` validates the requested ref name against Git naming rules before invoking `git branch <name>`, rejecting invalid names with a structured validation error.
  - `git_branch` with action `delete` validates the target branch exists and is not the current branch, rejecting unsafe deletions with an actionable error and leaving branches unchanged.
  - Invalid or missing input options (unknown action, missing required name) are rejected with structured validation errors before invoking `GitExecutor`.
  - Unit tests with `node:test` against temporary git fixture repositories verify list/create/delete behavior and ref-name validation.
- **Useful-if-stopped statement:** Equips agents to inspect and manage development branches safely.
