import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { after, before, describe, it } from "node:test";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  GitCommitResult,
  GitRestoreResult,
  GitStageResult,
  GitUnstageResult,
} from "../../src/models/mutation.js";
import type { GitStatusResult } from "../../src/models/inspection.js";
import { createFixtureRepo } from "../helpers/fixture-repo.js";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, "../..");
const serverEntry = path.join(packageRoot, "src", "index.ts");

async function git(cwd: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", args, { cwd });
  return result.stdout;
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

function statusPaths(status: GitStatusResult): string[] {
  return status.entries.map((entry) => entry.path).sort();
}

describe("Mutation tools over stdio", () => {
  let client: Client;
  let transport: StdioClientTransport;

  before(async () => {
    client = new Client({ name: "mutation-e2e-client", version: "1.0.0" }, { capabilities: {} });
    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", serverEntry],
      cwd: packageRoot,
    });
    await client.connect(transport);
  });

  after(async () => {
    await client.close();
  });

  it("lists all mutation tools with descriptions and input schemas", async () => {
    const { tools } = await client.listTools();
    const mutationTools = tools
      .filter((tool) => tool.name.startsWith("git_"))
      .filter((tool) =>
        ["git_stage", "git_unstage", "git_restore", "git_commit"].includes(tool.name),
      );

    assert.deepEqual(mutationTools.map((tool) => tool.name).sort(), [
      "git_commit",
      "git_restore",
      "git_stage",
      "git_unstage",
    ]);
    for (const tool of mutationTools) {
      assert.ok(tool.description, `${tool.name} must have a description`);
      assert.equal(tool.inputSchema.type, "object", `${tool.name} must declare an object schema`);
      assert.ok(Object.keys(tool.inputSchema.properties ?? {}).length > 0);
    }
  });

  // @qa-p03-012: End-to-end stage, unstage, restore, and commit workflow over stdio
  it("drives stage -> unstage -> restore -> commit and reflects each status transition", async () => {
    const repo = await createFixtureRepo("mutation-e2e-workflow-");
    try {
      await writeFile(repo.path, "README.md", "# Fixture\n");
      await writeFile(repo.path, "tracked.txt", "original\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);

      await writeFile(repo.path, "README.md", "# Fixture\nupdated\n");
      await writeFile(repo.path, "tracked.txt", "original\nunstaged\n");
      await writeFile(repo.path, "untracked.txt", "new file\n");

      const stage = parseToolResult(
        await client.callTool({
          name: "git_stage",
          arguments: { repo_path: repo.path, paths: ["README.md", "untracked.txt"] },
        }),
      ) as GitStageResult;
      assert.deepEqual(stage.staged_paths, ["README.md", "untracked.txt"]);

      let status = parseToolResult(
        await client.callTool({ name: "git_status", arguments: { repo_path: repo.path } }),
      ) as GitStatusResult;
      assert.deepEqual(statusPaths(status), ["README.md", "tracked.txt", "untracked.txt"]);
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
        "added",
      );

      const unstage = parseToolResult(
        await client.callTool({
          name: "git_unstage",
          arguments: { repo_path: repo.path, paths: ["untracked.txt"] },
        }),
      ) as GitUnstageResult;
      assert.deepEqual(unstage.unstaged_paths, ["untracked.txt"]);

      status = parseToolResult(
        await client.callTool({ name: "git_status", arguments: { repo_path: repo.path } }),
      ) as GitStatusResult;
      assert.equal(
        status.entries.find((entry) => entry.path === "README.md")?.staged_status,
        "modified",
      );
      assert.equal(
        status.entries.find((entry) => entry.path === "untracked.txt")?.staged_status,
        "untracked",
      );

      const restore = parseToolResult(
        await client.callTool({
          name: "git_restore",
          arguments: { repo_path: repo.path, paths: ["tracked.txt"] },
        }),
      ) as GitRestoreResult;
      assert.deepEqual(restore.restored_paths, ["tracked.txt"]);
      assert.equal(
        (await fs.readFile(path.join(repo.path, "tracked.txt"), "utf8")).replace(/\r\n/g, "\n"),
        "original\n",
      );

      const commit = parseToolResult(
        await client.callTool({
          name: "git_commit",
          arguments: {
            repo_path: repo.path,
            subject: "feat: update fixture",
            body: "Keep the staged change.\nAcross multiple lines.",
            footers: ["Refs: #123"],
          },
        }),
      ) as GitCommitResult;
      assert.equal(commit.subject, "feat: update fixture");
      assert.match(commit.commit_sha, /^[0-9a-f]{40}$/);

      status = parseToolResult(
        await client.callTool({ name: "git_status", arguments: { repo_path: repo.path } }),
      ) as GitStatusResult;
      assert.deepEqual(statusPaths(status), ["untracked.txt"]);
      assert.equal(status.entries[0].staged_status, "untracked");
      assert.equal(
        await git(repo.path, ["log", "-1", "--format=%B"]),
        "feat: update fixture\n\nKeep the staged change.\nAcross multiple lines.\n\nRefs: #123\n\n",
      );
    } finally {
      await repo.cleanup();
    }
  });

  it("rejects traversal and unsafe wildcard inputs without mutating the repository", async () => {
    const repo = await createFixtureRepo("mutation-e2e-safety-");
    try {
      await writeFile(repo.path, "README.md", "# Fixture\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);
      await writeFile(repo.path, "README.md", "# Fixture\nmodified\n");
      const before = await git(repo.path, ["status", "--porcelain"]);

      for (const request of [
        { name: "git_stage", arguments: { repo_path: repo.path, paths: ["../outside.txt"] } },
        { name: "git_unstage", arguments: { repo_path: repo.path, paths: ["../outside.txt"] } },
        { name: "git_restore", arguments: { repo_path: repo.path, paths: ["*"] } },
        {
          name: "git_commit",
          arguments: {
            repo_path: path.join(repo.path, "..", "missing-*"),
            subject: "feat: unsafe",
          },
        },
      ]) {
        const result = await client.callTool(request);
        assert.equal(result.isError, true, `${request.name} must reject unsafe input`);
      }

      assert.equal(await git(repo.path, ["status", "--porcelain"]), before);
      assert.equal(
        await fs.readFile(path.join(repo.path, "README.md"), "utf8"),
        "# Fixture\nmodified\n",
      );
    } finally {
      await repo.cleanup();
    }
  });
});
