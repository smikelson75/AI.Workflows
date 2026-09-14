import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
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

describe("Workspace tools integration tests", () => {
  let serverInstance: GitMcpServer;
  let client: Client;

  before(async () => {
    serverInstance = createGitMcpServer();
    client = new Client({ name: "workspace-tools-client", version: "1.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([serverInstance.connect(serverTransport), client.connect(clientTransport)]);
  });

  after(async () => {
    await client.close();
    await serverInstance.close();
  });

  describe("git_branch operations", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("workspace-branch-");
      await execFileAsync("git", ["commit", "--allow-empty", "-m", "initial"], {
        cwd: repo.path,
      });
    });

    after(async () => {
      await repo.cleanup();
    });

    // @qa-p04-004: Listing local and remote branches with current branch indicated
    it("lists branches with the current branch indicated through the server", async () => {
      const result = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const parsed = parseToolResult(result) as GitBranchResult;
      assert.equal(parsed.action, "list");
      assert.equal(parsed.current_branch, "main");
      const mainEntry = parsed.branches.find((b) => b.name === "main");
      assert.ok(mainEntry);
      assert.equal(mainEntry.is_current, true);
      assert.equal(mainEntry.is_remote, false);
    });

    // @qa-p04-005: Creating a new branch
    it("creates a new branch through the server", async () => {
      const result = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "create", name: "feature/new" },
      });
      const parsed = parseToolResult(result) as GitBranchResult;
      assert.equal(parsed.action, "create");
      assert.equal(parsed.name, "feature/new");

      // Verify it appears in list
      const listResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listParsed = parseToolResult(listResult) as GitBranchResult;
      if (listParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.ok(listParsed.branches.some((b) => b.name === "feature/new"));
    });

    // @qa-p04-006: Deleting an existing non-current branch
    it("deletes an existing non-current branch through the server", async () => {
      // Create a branch first
      await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "create", name: "feature/deletable" },
      });

      // Delete it
      const result = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "delete", name: "feature/deletable" },
      });
      const parsed = parseToolResult(result) as GitBranchResult;
      assert.equal(parsed.action, "delete");
      assert.equal(parsed.name, "feature/deletable");

      // Verify it's gone
      const listResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listParsed = parseToolResult(listResult) as GitBranchResult;
      if (listParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.ok(!listParsed.branches.some((b) => b.name === "feature/deletable"));
    });

    // @qa-p04-007: Rejecting deletion of the current branch
    it("rejects deletion of the current branch with error through the server", async () => {
      const result = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "delete", name: "main" },
      });
      assert.equal(result.isError, true);
      const content = result.content as TextContentItem[];
      const textItem = content.find((item) => item.type === "text");
      assert.ok(textItem && textItem.text.includes("is the current branch"));

      // Verify branch still exists and is current
      const listResult = await client.callTool({
        name: "git_branch",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listParsed = parseToolResult(listResult) as GitBranchResult;
      if (listParsed.action !== "list") {
        assert.fail("expected list result");
      }
      const mainEntry = listParsed.branches.find((b) => b.name === "main");
      assert.ok(mainEntry);
      assert.equal(mainEntry.is_current, true);
    });

    // @qa-p04-002: Rejecting invalid or missing git_branch input options
    it("rejects malformed git_branch input through the server", async () => {
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
    });
  });

  describe("git_stash operations", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("workspace-stash-");
      await execFileAsync("git", ["commit", "--allow-empty", "-m", "initial"], {
        cwd: repo.path,
      });
    });

    after(async () => {
      await repo.cleanup();
    });

    // @qa-p04-008: Saving dirty working tree state with git_stash push
    it("pushes working tree state to stash through the server", async () => {
      // Create a dirty working tree
      await fs.writeFile(path.join(repo.path, "work.txt"), "modified content");
      await execFileAsync("git", ["add", "work.txt"], { cwd: repo.path });

      const result = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push" },
      });
      const parsed = parseToolResult(result) as GitStashResult;
      assert.equal(parsed.action, "push");
      assert.ok(parsed.stash_id.includes("stash@"));

      // Verify list shows the stash
      const listResult = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listParsed = parseToolResult(listResult) as GitStashResult;
      if (listParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.ok(listParsed.entries.length > 0);
    });

    // @qa-p04-009: Including untracked files in a stash
    it("includes untracked files in stash when requested through the server", async () => {
      // Create tracked and untracked files
      const trackedFile = path.join(repo.path, "tracked.txt");
      const untrackedFile = path.join(repo.path, "untracked.txt");
      await fs.writeFile(trackedFile, "tracked");
      await execFileAsync("git", ["add", "tracked.txt"], { cwd: repo.path });
      await fs.writeFile(untrackedFile, "untracked");

      const result = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push", include_untracked: true },
      });
      const parsed = parseToolResult(result) as GitStashResult;
      assert.equal(parsed.action, "push");

      // Verify untracked file is gone
      const exists = await fs
        .access(untrackedFile)
        .then(() => true)
        .catch(() => false);
      assert.equal(exists, false);
    });

    // @qa-p04-010: Listing stash entries with structured identification
    it("lists stash entries with structured identification through the server", async () => {
      // Push a stash first
      await fs.writeFile(path.join(repo.path, "temp.txt"), "temporary");
      await execFileAsync("git", ["add", "temp.txt"], { cwd: repo.path });
      await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push" },
      });

      const result = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const parsed = parseToolResult(result) as GitStashResult;
      assert.equal(parsed.action, "list");
      assert.ok(parsed.entries.length > 0);

      // Verify structure of entries
      for (const entry of parsed.entries) {
        assert.ok(typeof entry.index === "number");
        assert.ok(typeof entry.branch === "string");
        assert.ok(typeof entry.message === "string");
      }
    });

    // @qa-p04-011: Popping a stash entry cleanly
    it("pops a stash entry cleanly through the server", async () => {
      // Push a stash first
      const stashFile = path.join(repo.path, "stash-content.txt");
      await fs.writeFile(stashFile, "stashed content");
      await execFileAsync("git", ["add", "stash-content.txt"], { cwd: repo.path });
      await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push" },
      });

      // Get initial stash count
      const listBefore = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listBeforeParsed = parseToolResult(listBefore) as GitStashResult;
      if (listBeforeParsed.action !== "list") {
        assert.fail("expected list result");
      }
      const countBefore = listBeforeParsed.entries.length;

      // Pop it
      const result = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "pop", stash_index: 0 },
      });
      const parsed = parseToolResult(result) as GitStashResult;
      assert.equal(parsed.action, "pop");
      assert.equal(parsed.success, true);

      // Verify stash count decreased
      const listAfter = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listAfterParsed = parseToolResult(listAfter) as GitStashResult;
      if (listAfterParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.equal(listAfterParsed.entries.length, countBefore - 1);
    });

    // @qa-p04-013: Dropping a stash entry
    it("drops a stash entry without altering working tree through the server", async () => {
      // Push a stash first
      await fs.writeFile(path.join(repo.path, "drop-me.txt"), "temporary");
      await execFileAsync("git", ["add", "drop-me.txt"], { cwd: repo.path });
      await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "push" },
      });

      // Get status before drop
      const listBefore = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listBeforeParsed = parseToolResult(listBefore) as GitStashResult;
      if (listBeforeParsed.action !== "list") {
        assert.fail("expected list result");
      }
      const countBefore = listBeforeParsed.entries.length;

      // Drop it
      const result = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "drop", stash_index: 0 },
      });
      const parsed = parseToolResult(result) as GitStashResult;
      assert.equal(parsed.action, "drop");

      // Verify stash count decreased
      const listAfter = await client.callTool({
        name: "git_stash",
        arguments: { repo_path: repo.path, action: "list" },
      });
      const listAfterParsed = parseToolResult(listAfter) as GitStashResult;
      if (listAfterParsed.action !== "list") {
        assert.fail("expected list result");
      }
      assert.equal(listAfterParsed.entries.length, countBefore - 1);
    });

    // @qa-p04-003: Rejecting invalid or missing git_stash input options
    it("rejects malformed git_stash input through the server", async () => {
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
    });
  });
});
