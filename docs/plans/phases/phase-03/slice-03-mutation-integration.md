# Slice 03 - Mutation tools integration & E2E verification

- **User-visible outcome:** An MCP client connected over stdio can drive the full stage -> unstage -> restore -> commit loop across `git_stage`, `git_unstage`, `git_restore`, and `git_commit` against real fixture repositories, proving Phase 03's mutation tools operate end-to-end against the phase acceptance contract.
- **Backend/data slice:** `packages/git-mcp-server/test/integration/mutation-tools.test.ts`.
- **UI/workflow slice:** Stdio client dispatch of all four mutation tools, exercising tool listing (`ListToolsRequestSchema`) and tool calling (`CallToolRequestSchema`) sequentially against live fixture repositories.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/test/integration/mutation-tools.test.ts`
  - `docs/plans/phases/phase-03/acceptance.feature`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `ListToolsRequestSchema` lists all 4 mutation tools with descriptions and schema definitions.
  - Integration suite executes a stage -> unstage -> restore -> commit sequence against fixtures with staged, unstaged, and untracked changes, confirming `git_status` reflects each transition.
  - Path-traversal and unsafe-wildcard inputs are rejected across all four tools without mutating the fixture repository.
  - All non-excepted `@e2e` scenarios in `phases/phase-03/acceptance.feature` pass, and all `@unit` and `@integration` scenario IDs map to executable tests.
- **Useful-if-stopped statement:** Closes Phase 03 with full end-to-end verification of safe Git mutation capabilities.
