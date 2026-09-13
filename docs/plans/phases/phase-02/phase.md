# Phase 02 - Inspection & Read-Only Tools

- **Phase objective:** Implement and register the four core read-only inspection tools: `git_status`, `git_diff`, `git_log`, and `git_info`, with typed input schema validation and structured JSON output models.
- **User-visible outcome:** MCP clients can inspect working tree porcelain status, retrieve patch/stat/name-only diffs, query formatted commit history, and fetch repository metadata without manual text parsing.
- **Backend/data scope:** `src/tools/inspection/status.ts`, `src/tools/inspection/diff.ts`, `src/tools/inspection/log.ts`, `src/tools/inspection/info.ts`, `src/models/inspection.ts`, `test/tools/inspection/*.test.ts`.
- **UI/workflow scope:** MCP tool registration via `server.setRequestHandler(ListToolsRequestSchema, ...)` and `CallToolRequestSchema`.
- **Cross-slice invariants:**
  - All tools must validate inputs using Zod or JSON schemas.
  - Parsing of Git command outputs must produce strongly typed TypeScript interfaces.
  - Tools must never write to disk or mutate the repository index.
  - Porcelain format parsing must handle untracked, modified, deleted, staged, and rename statuses reliably.
- **Prerequisites:** Phase 01 completed.
- **Blockers:** None.
- **Acceptance checks:**
  - `git_status` returns structured status codes and file paths matching git porcelain v1/v2 output.
  - `git_diff` accurately supports working tree vs index and staged vs HEAD in patch and stat modes.
  - `git_log` parses commit SHAs, author metadata, dates, and conventional commit headers.
  - `git_info` returns root directory path, active branch name, HEAD commit SHA, and clean working tree indicator.
- **Useful-if-stopped statement:** Equips agents with high-fidelity, read-only situational awareness of any repository.
- **Risks and mitigations:**
  - Risk: Diff output size could exceed MCP message limits on large changesets.
  - Mitigation: Enforce reasonable output truncation or line limits with clear truncation indicators.
- **Definition of done:** All inspection tools registered, verified with unit tests, and passing acceptance tests.

## Slice order

1. [Slice 01 - git_status & git_info tools](slice-01-git-status-info.md)
2. [Slice 02 - git_diff & git_log tools](slice-02-git-diff-log.md)
3. [Slice 03 - Inspection tools integration & E2E verification](slice-03-inspection-integration.md)
