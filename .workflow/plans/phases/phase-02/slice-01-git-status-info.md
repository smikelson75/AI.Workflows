# Slice 01 - git_status & git_info tools

- **User-visible outcome:** MCP clients can call `git_status` to retrieve structured porcelain status with two-character status codes and `git_info` to retrieve repository metadata (root, current branch, HEAD SHA, clean indicator).
- **Backend/data slice:** `packages/git-mcp-server/src/models/inspection.ts`, `packages/git-mcp-server/src/tools/inspection/status.ts`, `packages/git-mcp-server/src/tools/inspection/info.ts`, `packages/git-mcp-server/src/server.ts`, `packages/git-mcp-server/test/tools/status.test.ts`, `packages/git-mcp-server/test/tools/info.test.ts`.
- **UI/workflow slice:** Registration of `git_status` and `git_info` tools on the MCP server with JSON Schema input validation and structured JSON result serialization.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/models/inspection.ts`
  - `packages/git-mcp-server/src/tools/inspection/status.ts`
  - `packages/git-mcp-server/src/tools/inspection/info.ts`
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/test/tools/status.test.ts`
  - `packages/git-mcp-server/test/tools/info.test.ts`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `git_status` tool validates input parameters with Zod schema (`repo_path`, `untracked_files`, `ignored`).
  - `git_status` parses porcelain v1/v2 output into structured items with `path`, `staged_status`, `unstaged_status`, and `status_code`.
  - `git_info` tool validates input parameters and returns `repo_root`, `current_branch`, `head_sha`, and `is_clean`.
  - Calling tools via MCP protocol request yields schema-conformant JSON-RPC responses.
  - Unit tests with `node:test` against temporary git fixture repositories verify all status code variations and metadata retrieval.
- **Useful-if-stopped statement:** Delivers the primary situational awareness tools for repository state and working tree inspection.
