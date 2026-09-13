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
import { createGitMcpServer, type GitMcpServer } from "../../src/index.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

const execFileAsync = promisify(execFile);

async function git(cwd: string, args: string[]): Promise<void> {
  await execFileAsync("git", args, { cwd });
}

async function writeFile(repoPath: string, relPath: string, content: string): Promise<void> {
  const fullPath = path.join(repoPath, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf8");
}

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

describe("Inspection tools end-to-end integration", () => {
  let serverInstance: GitMcpServer;
  let client: Client;

  before(async () => {
    serverInstance = createGitMcpServer();
    client = new Client({ name: "inspection-e2e-client", version: "1.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([serverInstance.connect(serverTransport), client.connect(clientTransport)]);
  });

  after(async () => {
    await client.close();
    await serverInstance.close();
  });

  // @qa-p02-009: End-to-end repository inspection workflow over stdio
  describe("tool discovery", () => {
    it("lists all 4 inspection tools with descriptions and input schemas", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((tool) => tool.name).sort();
      assert.deepEqual(names, ["git_diff", "git_info", "git_log", "git_status"]);

      for (const tool of tools) {
        assert.ok(
          typeof tool.description === "string" && tool.description.length > 0,
          `${tool.name} must have a non-empty description`,
        );
        assert.equal(tool.inputSchema.type, "object", `${tool.name} must declare an object schema`);
      }
    });
  });

  describe("inspection sequence against a dirty repository", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("inspection-e2e-dirty-");
      await writeFile(repo.path, "README.md", "# Fixture\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);
      await writeFile(repo.path, "tracked.txt", "tracked content\n");
      await git(repo.path, ["add", "tracked.txt"]);
      await git(repo.path, ["commit", "-m", "Add tracked file"]);

      // staged modification
      await writeFile(repo.path, "README.md", "# Fixture\nUpdated staged content\n");
      await git(repo.path, ["add", "README.md"]);
      // unstaged modification
      await writeFile(repo.path, "tracked.txt", "tracked content\nunstaged edit\n");
      // untracked file
      await writeFile(repo.path, "untracked.txt", "untracked content\n");
    });

    after(async () => {
      await repo.cleanup();
    });

    it("runs git_info -> git_status -> git_diff -> git_log and returns structured, schema-consistent responses", async () => {
      const infoResult = await client.callTool({
        name: "git_info",
        arguments: { repo_path: repo.path },
      });
      const info = parseToolResult(infoResult) as GitInfoResult;
      assert.equal(info.current_branch, "main");
      assert.ok(info.head_sha, "head_sha must be populated");
      assert.equal(info.is_clean, false);

      const statusResult = await client.callTool({
        name: "git_status",
        arguments: { repo_path: repo.path, untracked_files: "normal" },
      });
      const status = parseToolResult(statusResult) as GitStatusResult;
      assert.equal(status.is_clean, false);
      const paths = status.entries.map((entry) => entry.path).sort();
      assert.deepEqual(paths, ["README.md", "tracked.txt", "untracked.txt"]);
      assert.equal(
        status.entries.find((entry) => entry.path === "README.md")?.staged_status,
        "modified",
      );
      assert.equal(
        status.entries.find((entry) => entry.path === "tracked.txt")?.unstaged_status,
        "modified",
      );
      assert.equal(
        status.entries.find((entry) => entry.path === "untracked.txt")?.staged_status,
        "untracked",
      );

      const diffResult = await client.callTool({
        name: "git_diff",
        arguments: { repo_path: repo.path, staged: true, mode: "patch" },
      });
      const diff = parseToolResult(diffResult) as GitDiffResult;
      assert.equal(diff.mode, "patch");
      assert.equal(diff.staged, true);
      assert.ok(diff.patch?.includes("README.md"));

      const logResult = await client.callTool({
        name: "git_log",
        arguments: { repo_path: repo.path, max_count: 5 },
      });
      const log = parseToolResult(logResult) as GitLogResult;
      assert.equal(log.commits.length, 2);
      assert.equal(log.commits[0].subject, "Add tracked file");
    });
  });

  describe("inspection sequence against a clean repository", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("inspection-e2e-clean-");
      await writeFile(repo.path, "README.md", "# Fixture\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);
    });

    after(async () => {
      await repo.cleanup();
    });

    it("reports a clean working tree and index across all four tools", async () => {
      const infoResult = await client.callTool({
        name: "git_info",
        arguments: { repo_path: repo.path },
      });
      const info = parseToolResult(infoResult) as GitInfoResult;
      assert.equal(info.is_clean, true);

      const statusResult = await client.callTool({
        name: "git_status",
        arguments: { repo_path: repo.path },
      });
      const status = parseToolResult(statusResult) as GitStatusResult;
      assert.equal(status.is_clean, true);
      assert.equal(status.entries.length, 0);

      const diffResult = await client.callTool({
        name: "git_diff",
        arguments: { repo_path: repo.path, mode: "patch" },
      });
      const diff = parseToolResult(diffResult) as GitDiffResult;
      assert.equal(diff.is_clean, true);

      const logResult = await client.callTool({
        name: "git_log",
        arguments: { repo_path: repo.path },
      });
      const log = parseToolResult(logResult) as GitLogResult;
      assert.equal(log.commits.length, 1);
    });
  });

  describe("inspection sequence against branch-divergent history", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("inspection-e2e-branch-");
      await writeFile(repo.path, "README.md", "# Fixture\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);

      await git(repo.path, ["checkout", "-b", "feature"]);
      await writeFile(repo.path, "feature.txt", "feature content\n");
      await git(repo.path, ["add", "feature.txt"]);
      await git(repo.path, ["commit", "-m", "Add feature file"]);

      await git(repo.path, ["checkout", "main"]);
      await writeFile(repo.path, "main-only.txt", "main content\n");
      await git(repo.path, ["add", "main-only.txt"]);
      await git(repo.path, ["commit", "-m", "Add main-only file"]);
    });

    after(async () => {
      await repo.cleanup();
    });

    it("reflects the active branch and filters commit history by path", async () => {
      const infoResult = await client.callTool({
        name: "git_info",
        arguments: { repo_path: repo.path },
      });
      const info = parseToolResult(infoResult) as GitInfoResult;
      assert.equal(info.current_branch, "main");
      assert.equal(info.is_clean, true);

      const logResult = await client.callTool({
        name: "git_log",
        arguments: { repo_path: repo.path, path: "main-only.txt" },
      });
      const log = parseToolResult(logResult) as GitLogResult;
      assert.equal(log.commits.length, 1);
      assert.equal(log.commits[0].subject, "Add main-only file");

      const diffResult = await client.callTool({
        name: "git_diff",
        arguments: { repo_path: repo.path, mode: "name_only", base: "main", target: "feature" },
      });
      const diff = parseToolResult(diffResult) as GitDiffResult;
      assert.ok(diff.files?.includes("feature.txt"));
      assert.ok(diff.files?.includes("main-only.txt"));
    });
  });

  describe("large diff output truncation", () => {
    let repo: FixtureRepo;

    before(async () => {
      repo = await createFixtureRepo("inspection-e2e-truncate-");
      const lines = Array.from({ length: 200 }, (_, i) => `line ${String(i)}`).join("\n");
      await writeFile(repo.path, "large.txt", `${lines}\n`);
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Add large file"]);

      const updatedLines = Array.from({ length: 200 }, (_, i) => `line ${String(i)} updated`).join(
        "\n",
      );
      await writeFile(repo.path, "large.txt", `${updatedLines}\n`);
    });

    after(async () => {
      await repo.cleanup();
    });

    it("truncates patch output exceeding max_lines and includes a diagnostic message", async () => {
      const diffResult = await client.callTool({
        name: "git_diff",
        arguments: { repo_path: repo.path, mode: "patch", max_lines: 10 },
      });
      const diff = parseToolResult(diffResult) as GitDiffResult;
      assert.equal(diff.is_truncated, true);
      assert.ok(diff.patch?.includes("truncated"));
    });
  });
});
