# Slice 03 - Server bootstrap & execution verification (integration/E2E)

- **User-visible outcome:** The MCP server launches over stdio, performs the MCP initialization handshake with client capabilities, responds to ping/capabilities queries, and verifies end-to-end integration with the underlying Git execution engine against the phase acceptance scenarios.
- **Backend/data slice:** `packages/git-mcp-server/src/server.ts`, `packages/git-mcp-server/src/index.ts`, `packages/git-mcp-server/test/integration/server.test.ts`.
- **UI/workflow slice:** Stdio transport initialization, JSON-RPC lifecycle, signal handling (`SIGINT`, `SIGTERM`), and client connection management.
- **Files/modules in scope:**
  - `packages/git-mcp-server/src/server.ts`
  - `packages/git-mcp-server/src/index.ts`
  - `packages/git-mcp-server/test/integration/server.test.ts`
  - `.workflow/plans/phases/phase-01/acceptance.feature`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify && npm --prefix packages/git-mcp-server test`
- **Acceptance checks:**
  - Server successfully starts and establishes communication over `StdioServerTransport`.
  - Client initialization handshake completes successfully, exchanging server name and version metadata.
  - Integration test connects an in-process MCP client to the server and verifies basic health/liveness.
  - Clean shutdown occurs when stdin closes or termination signals are received.
  - All non-excepted `@e2e` scenarios in `phases/phase-01/acceptance.feature` pass, and all `@unit` and `@integration` scenario IDs map to executable tests.
- **Useful-if-stopped statement:** Completes Phase 01 by providing a fully verified, runnable MCP server binary ready to register and host tool definitions.
