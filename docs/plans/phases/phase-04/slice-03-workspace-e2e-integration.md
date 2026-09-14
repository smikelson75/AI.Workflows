# Slice 03 - Workspace tools integration & full-lifecycle E2E verification

- **User-visible outcome:** An MCP client connected over stdio can drive the complete 10-tool surface through a realistic agent lifecycle (Discover -> Diff -> Stage -> Stash -> Pop -> Commit -> Log), and observe structured error rejections with state preservation for every approved Phase 04 scenario.
- **Backend/data slice:** `packages/git-mcp-server/test/integration/workspace-tools.test.ts`, `packages/git-mcp-server/test/e2e/workflow.test.ts`.
- **UI/workflow slice:** Stdio client dispatch of `git_branch` and `git_stash`, plus a full multi-tool lifecycle test exercising all 10 registered tools sequentially against isolated live fixture repositories.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/test/integration/workspace-tools.test.ts`
  - `packages/git-mcp-server/test/e2e/workflow.test.ts`
  - `docs/plans/phases/phase-04/acceptance.feature`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - `ListToolsRequestSchema` lists all 10 registered tools with descriptions and schema definitions.
  - Dedicated stdio tests cover `git_branch` list/create/delete and `git_stash` list/push/pop/drop as positive workflows against isolated fixture repositories.
  - Dedicated stdio test proves the full lifecycle: Discover (`git_info`/`git_status`) -> Diff (`git_diff`) -> Stage (`git_stage`) -> Stash (`git_stash push`) -> Pop (`git_stash pop`) -> Commit (`git_commit`) -> Log (`git_log`), asserting each step's structured output feeds correctly into the next.
  - Dedicated stdio test asserts a stash-pop conflict returns a structured, actionable error (`isError: true`) without crashing the server, and leaves the server healthy for a subsequent valid call.
  - Dedicated stdio test asserts an invalid branch delete (current or non-existent branch) is rejected with an actionable error and leaves branch state unchanged.
  - Complete scenario-ID mapping for all Phase 04 `acceptance.feature` scenarios once authored by `qa-design`; every `@unit`/`@integration` ID maps to an executable test and every non-excepted `@e2e` scenario is implemented.
  - Full test suite passes on the current host OS; verification gate `npm run verify` is clean.
- **Useful-if-stopped statement:** Closes Phase 04 with full end-to-end verification of the complete v1 Git MCP server tool surface.
