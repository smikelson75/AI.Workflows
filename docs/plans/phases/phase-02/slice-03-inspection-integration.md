# Slice 03 - Inspection tools integration & E2E verification

- **User-visible outcome:** An MCP client connected over stdio can invoke `git_status`, `git_diff`, `git_log`, and `git_info` across complex repository states in an automated workflow, proving that all Phase 02 read-only tools operate end-to-end against the phase acceptance contract.
- **Backend/data slice:** `packages/git-mcp-server/test/integration/inspection-tools.test.ts`.
- **UI/workflow slice:** Stdio client dispatch of all four inspection tools, exercising tool listing (`ListToolsRequestSchema`) and tool calling (`CallToolRequestSchema`) sequentially against live fixture repositories.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/test/integration/inspection-tools.test.ts`
  - `docs/plans/phases/phase-02/acceptance.feature`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `ListToolsRequestSchema` lists all 4 inspection tools with descriptions and schema definitions.
  - Integration suite executes an inspect sequence (`git_info` -> `git_status` -> `git_diff` -> `git_log`) against dirty, clean, and branch-divergent fixtures.
  - Output sizes exceeding safe limits are truncated with appropriate diagnostic messages.
  - All non-excepted `@e2e` scenarios in `phases/phase-02/acceptance.feature` pass, and all `@unit` and `@integration` scenario IDs map to executable tests.
- **Useful-if-stopped statement:** Closes Phase 02 with full end-to-end verification of read-only Git MCP inspection capabilities.
