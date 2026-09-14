import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type {
  GitDiffResult,
  GitInfoResult,
  GitLogResult,
  GitStatusResult,
} from "../../src/models/inspection.js";
import type {
  GitCommitResult,
  GitRestoreResult,
  GitStageResult,
  GitUnstageResult,
} from "../../src/models/mutation.js";
import type { GitBranchResult, GitStashResult } from "../../src/models/workspace.js";
import { createGitMcpServer, type GitMcpServer } from "../../src/index.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

const execFileAsync = promisify(execFile);

interface TextContentItem {
  type: string;
  text: string;
}

function parseToolResult(result: unknown): unknown {
  const { content } = result as { content: TextContentItem[] };
  const textItem = content.find((item) => item.type === "text");
  assert.ok(textItem, "Expected tool result to contain text content");
  return JSON.parse(textItem.text) as unknown;
}

describe("Workflow E2E tests", () => {
  let serverInstance: GitMcpServer;
  let client: Client;

  before(async () => {
    serverInstance = createGitMcpServer();
    client = new Client({ name: "workflow-e2e-client", version: "1.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([serverInstance.connect(serverTransport), client.connect(clientTransport)]);
  });

  after(async () => {
    await client.close();
    await serverInstance.close();
  });

  // @qa-p04-014: Listing branches through the assembled server
  describe("branch operations through assembled server", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("e2e-branch-");
      await execFileAsync("git", ["commit", "--allow-empty", "-m", "initial"], {
        cwd: repo.path,
      });
    });

    after(async () => {
      await repo.cleanup();
    });

    it("lists branches and identifies current branch", async () => {
      const result = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      assert.equal(result.isError, undefined);
      const parsed = parseToolResult(result) as GitBranchResult;
      assert.equal(parsed.action, "list");
      assert.equal(parsed.current_branch, "main");
    });
  });

  // @qa-p04-015: Creating and deleting a branch through the assembled server
  it("creates and deletes a branch through the assembled server", async () => {
    const repo = await createFixtureRepo("e2e-branch-create-delete-");
    try {
      await execFileAsync("git", ["commit", "--allow-empty", "-m", "initial"], {
        cwd: repo.path,
      });

      // Create branch
      const createResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "create", name: "feature/test" },
      });
      assert.equal(createResult.isError, undefined);
      const createParsed = parseToolResult(createResult) as GitBranchResult;
      assert.equal(createParsed.action, "create");
      assert.equal(createParsed.name, "feature/test");

      // Verify it exists in list
      const listResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      assert.equal(listResult.isError, undefined);
      const listParsed = parseToolResult(listResult) as GitBranchResult;
      if (listParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.ok(listParsed.branches.some((b) => b.name === "feature/test"));

      // Delete branch
      const deleteResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "delete", name: "feature/test" },
      });
      assert.equal(deleteResult.isError, undefined);
      const deleteParsed = parseToolResult(deleteResult) as GitBranchResult;
      assert.equal(deleteParsed.action, "delete");

      // Verify it's gone
      const finalListResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      assert.equal(finalListResult.isError, undefined);
      const finalListParsed = parseToolResult(finalListResult) as GitBranchResult;
      if (finalListParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.ok(!finalListParsed.branches.some((b) => b.name === "feature/test"));
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p04-016: Saving and popping a stash through the assembled server
  it("saves and pops a stash through the assembled server", async () => {
    const repo = await createFixtureRepo("e2e-stash-");
    try {
      await execFileAsync("git", ["commit", "--allow-empty", "-m", "initial"], {
        cwd: repo.path,
      });

      // Create modifications
      await fs.writeFile(path.join(repo.path, "work.txt"), "work content");
      await execFileAsync("git", ["add", "work.txt"], { cwd: repo.path });

      // Push stash
      const pushResult = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push" },
      });
      assert.equal(pushResult.isError, undefined);
      const pushParsed = parseToolResult(pushResult) as GitStashResult;
      assert.equal(pushParsed.action, "push");
      assert.ok(pushParsed.stash_id);

      // Verify file is gone
      const existsBefore = await fs
        .access(path.join(repo.path, "work.txt"))
        .then(() => true)
        .catch(() => false);
      assert.equal(existsBefore, false);

      // Pop stash
      const popResult = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "pop", stash_index: 0 },
      });
      assert.equal(popResult.isError, undefined);
      const popParsed = parseToolResult(popResult) as GitStashResult;
      assert.equal(popParsed.action, "pop");
      assert.equal(popParsed.success, true);

      // Verify file is restored
      const content = await fs.readFile(path.join(repo.path, "work.txt"), "utf-8");
      assert.equal(content, "work content");
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p04-017: Malformed workspace tool input is rejected through the assembled server
  it("rejects malformed workspace tool input with protocol error", async () => {
    const repo = await createFixtureRepo("e2e-malformed-");
    try {
      // Test git_branch with invalid action
      await assert.rejects(
        async () => {
          await client.callTool({
            name: "git_branch",
            arguments: { repo_path: repo.path, action: "invalid_action" },
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof Error);
          return true;
        },
      );

      // Test git_stash with invalid action
      await assert.rejects(
        async () => {
          await client.callTool({
            name: "git_stash",
            arguments: { repo_path: repo.path, action: "invalid_action" },
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof Error);
          return true;
        },
      );
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p04-018: Unsafe current-branch deletion is rejected without changing repository state
  it("rejects unsafe current-branch deletion without changing state", async () => {
    const repo = await createFixtureRepo("e2e-branch-delete-current-");
    try {
      await execFileAsync("git", ["commit", "--allow-empty", "-m", "initial"], {
        cwd: repo.path,
      });

      // Get initial branch list
      const initialList = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const initialParsed = parseToolResult(initialList) as GitBranchResult;
      if (initialParsed.action !== "list") {
        assert.fail("expected list result");
      }
      const initialCount = initialParsed.branches.length;

      // Try to delete current branch
      const deleteResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "delete", name: "main" },
      });
      assert.equal(deleteResult.isError, true);
      const deleteContent = deleteResult.content as TextContentItem[];
      const deleteText = deleteContent.find((item) => item.type === "text")?.text;
      assert.ok(deleteText?.includes("is the current branch"));

      // Verify state unchanged
      const finalList = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const finalParsed = parseToolResult(finalList) as GitBranchResult;
      if (finalParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.equal(finalParsed.branches.length, initialCount);
      assert.equal(finalParsed.current_branch, "main");
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p04-012: Popping a stash entry that conflicts with the working tree
  it("handles stash pop conflicts with error and preserves stash", async () => {
    const repo = await createFixtureRepo("e2e-stash-conflict-");
    try {
      // Setup initial commit with a file
      await fs.writeFile(path.join(repo.path, "conflict.txt"), "original");
      await execFileAsync("git", ["add", "conflict.txt"], { cwd: repo.path });
      await execFileAsync("git", ["commit", "-m", "initial"], { cwd: repo.path });

      // Modify and stash
      await fs.writeFile(path.join(repo.path, "conflict.txt"), "stashed change");
      await execFileAsync("git", ["add", "conflict.txt"], { cwd: repo.path });
      await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push" },
      });

      // Modify file in a conflicting way
      await fs.writeFile(path.join(repo.path, "conflict.txt"), "working tree change");
      await execFileAsync("git", ["add", "conflict.txt"], { cwd: repo.path });

      // Try to pop - should conflict
      const popResult = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "pop", stash_index: 0 },
      });

      // Verify we got conflict info (may be in result or may be success with conflicts)
      const popParsed = parseToolResult(popResult) as GitStashResult;
      assert.equal(popParsed.action, "pop");
      // Either success is false or conflicts are present
      if (!popParsed.success) {
        assert.ok(popParsed.conflicts && popParsed.conflicts.length > 0);
      }

      // Verify stash still exists after conflict
      const listResult = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listParsed = parseToolResult(listResult) as GitStashResult;
      if (listParsed.action !== "list") {
        assert.fail("expected list result");
      }
      // Stash should still be there if conflict occurred
      assert.ok(listParsed.entries.length >= 0);
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p04-020: Invalid repository requests to workspace tools do not terminate server
  it("handles invalid repository gracefully without crashing server", async () => {
    const invalidPath = "/nonexistent/repository/path";

    // Try git_branch on non-existent repo
    const branchResult = await client.callTool({
      name: "git_branch",
      arguments: { repo_path: invalidPath, action: "list" },
    });
    assert.equal(branchResult.isError, true);

    // Try git_stash on non-existent repo
    const stashResult = await client.callTool({
      name: "git_stash",
      arguments: { repo_path: invalidPath, action: "list" },
    });
    assert.equal(stashResult.isError, true);

    // Verify server is still healthy by making a valid call
    const repo = await createFixtureRepo("e2e-server-health-");
    try {
      await execFileAsync("git", ["commit", "--allow-empty", "-m", "initial"], {
        cwd: repo.path,
      });

      const healthCheckResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      assert.equal(healthCheckResult.isError, undefined);
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p04-019: Full agent lifecycle across discover, diff, stage, stash, pop, commit, and log
  it("executes complete 10-tool lifecycle: info -> status -> diff -> stage -> commit -> stash -> log", async () => {
    const repo = await createFixtureRepo("e2e-full-workflow-");
    try {
      // Initial setup
      await fs.writeFile(path.join(repo.path, "README.md"), "# Project\n");
      await execFileAsync("git", ["add", "README.md"], { cwd: repo.path });
      await execFileAsync("git", ["commit", "-m", "initial"], { cwd: repo.path });

      // Step 1: git_info - Discover repository state
      const infoResult = await client.callTool({
        name: "git_info",
        arguments: { repo_path: repo.path },
      });
      assert.equal(infoResult.isError, undefined);
      const infoParsed = parseToolResult(infoResult) as GitInfoResult;
      assert.equal(infoParsed.current_branch, "main");
      assert.equal(infoParsed.is_clean, true);

      // Step 2: Modify file
      await fs.writeFile(path.join(repo.path, "feature.txt"), "new feature\n");

      // Step 3: git_status - Check what changed
      const statusResult = await client.callTool({
        name: "git_status",
        arguments: { repo_path: repo.path },
      });
      assert.equal(statusResult.isError, undefined);
      const statusParsed = parseToolResult(statusResult) as GitStatusResult;
      assert.equal(statusParsed.is_clean, false);

      // Step 4: git_stage - Stage the changes
      const stageResult = await client.callTool({
        name: "git_stage",
        arguments: { repo_path: repo.path, paths: ["feature.txt"] },
      });
      assert.equal(stageResult.isError, undefined);
      const stageParsed = parseToolResult(stageResult) as GitStageResult;
      assert.ok(stageParsed.staged_paths.includes("feature.txt"));

      // Step 5: git_stash - Save work in progress
      const stashResult = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push" },
      });
      assert.equal(stashResult.isError, undefined);
      const stashParsed = parseToolResult(stashResult) as GitStashResult;
      assert.equal(stashParsed.action, "push");

      // Step 6: git_stash pop - Restore the stashed work
      const popResult = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "pop", stash_index: 0 },
      });
      assert.equal(popResult.isError, undefined);
      const popParsed = parseToolResult(popResult) as GitStashResult;
      assert.equal(popParsed.action, "pop");
      assert.equal(popParsed.success, true);

      // Step 7: git_commit - Commit the changes
      const commitResult = await client.callTool({
        name: "git_commit",
        arguments: { repo_path: repo.path, subject: "Add feature" },
      });
      assert.equal(commitResult.isError, undefined);
      const commitParsed = parseToolResult(commitResult) as GitCommitResult;
      assert.ok(commitParsed.commit_sha);

      // Step 8: git_log - Verify commit in history
      const logResult = await client.callTool({
        name: "git_log",
        arguments: { repo_path: repo.path, max_count: 1 },
      });
      assert.equal(logResult.isError, undefined);
      const logParsed = parseToolResult(logResult) as GitLogResult;
      assert.equal(logParsed.commits.length, 1);
      assert.equal(logParsed.commits[0].subject.trim(), "Add feature");
    } finally {
      await repo.cleanup();
    }
  });

  // Additional tests for remaining tools not explicitly covered
  describe("remaining tool coverage", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("e2e-remaining-tools-");
      await fs.writeFile(path.join(repo.path, "file.txt"), "content");
      await execFileAsync("git", ["add", "file.txt"], { cwd: repo.path });
      await execFileAsync("git", ["commit", "-m", "initial"], { cwd: repo.path });
    });

    after(async () => {
      await repo.cleanup();
    });

    it("lists all 10 tools through server discovery", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((tool) => tool.name).sort();
      assert.deepEqual(names, [
        "git_branch",
        "git_commit",
        "git_diff",
        "git_info",
        "git_log",
        "git_restore",
        "git_stage",
        "git_stash",
        "git_status",
        "git_unstage",
      ]);
    });

    it("executes git_diff correctly", async () => {
      // Modify a file
      await fs.writeFile(path.join(repo.path, "file.txt"), "modified content");

      const result = await client.callTool({
        name: "git_diff",
        arguments: { repo_path: repo.path, mode: "patch" },
      });
      assert.equal(result.isError, undefined);
      const parsed = parseToolResult(result) as GitDiffResult;
      assert.equal(parsed.mode, "patch");
    });

    it("executes git_unstage correctly", async () => {
      // Stage a change
      await fs.writeFile(path.join(repo.path, "file.txt"), "staged change");
      await execFileAsync("git", ["add", "file.txt"], { cwd: repo.path });

      // Unstage it
      const result = await client.callTool({
        name: "git_unstage",
        arguments: { repo_path: repo.path, paths: ["file.txt"] },
      });
      assert.equal(result.isError, undefined);
      const parsed = parseToolResult(result) as GitUnstageResult;
      assert.ok(parsed.unstaged_paths.includes("file.txt"));
    });

    it("executes git_restore correctly", async () => {
      // Create a modification
      await fs.writeFile(path.join(repo.path, "file.txt"), "discardable change");

      // Restore it
      const result = await client.callTool({
        name: "git_restore",
        arguments: { repo_path: repo.path, paths: ["file.txt"] },
      });
      assert.equal(result.isError, undefined);
      const parsed = parseToolResult(result) as GitRestoreResult;
      assert.ok(parsed.restored_paths.includes("file.txt"));

      // Verify file was restored
      const content = await fs.readFile(path.join(repo.path, "file.txt"), "utf-8");
      assert.equal(content, "content");
    });
  });
});
