# Phase 03 - Staging & Mutation Tools

- **Phase objective:** Implement and register the four staging and mutation tools: `git_stage`, `git_unstage`, `git_restore`, and `git_commit`, with strict path boundaries and safeguards against accidental data loss.
- **User-visible outcome:** MCP clients can stage specific files, unstage indexed changes, restore modified files safely, and craft conventional commits with structured subjects, bodies, and footers.
- **Backend/data scope:** `src/tools/mutation/stage.ts`, `src/tools/mutation/unstage.ts`, `src/tools/mutation/restore.ts`, `src/tools/mutation/commit.ts`, `src/models/mutation.ts`, `test/tools/mutation/*.test.ts`.
- **UI/workflow scope:** MCP tool invocation for staging and commit mutations.
- **Cross-slice invariants:**
  - `git_restore` and `git_unstage` must require explicit path specifications to prevent accidental global reverts.
  - `git_commit` must verify that the index contains staged changes prior to committing (disallowing unintended empty commits).
  - All mutating operations must sanitize paths and ensure they remain inside the resolved repository root.
  - Multi-line commit subjects and bodies must be formatted cleanly without shell newline escaping corruptions.
- **Prerequisites:** Phase 02 completed.
- **Blockers:** None.
- **Acceptance checks:**
  - Files can be selectively staged and verified via `git_status`.
  - Staged files can be unstaged without discarding disk modifications.
  - Disk changes can be restored to index state on demand.
  - `git_commit` produces verifiable Git commits adhering to Conventional Commit specifications.
- **Useful-if-stopped statement:** Allows autonomous agents to complete the standard Stage -> Commit developer loop safely.
- **Risks and mitigations:**
  - Risk: Path traversal (e.g. `../../`) or unvalidated paths passed to `git add` or `git restore`.
  - Mitigation: Validate that all requested file paths resolve strictly within the repository root before execution.
- **Test checkpoints:**
  - Mutation tests verifying selective staging, clean rollbacks, and commit creations on fixture repos.
- **Definition of done:** All mutation tools registered, verified with unit tests, and passing acceptance tests.

## Slice order

1. [Slice 01 - git_stage & git_unstage tools](slice-01-stage-unstage-tools.md)
2. [Slice 02 - git_restore & git_commit tools](slice-02-restore-commit-tools.md)
3. [Slice 03 - Mutation tools integration & E2E verification](slice-03-mutation-integration.md)
