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

  // @qa-p03-012 @e2e
  it("stages selected paths through the assembled server (@qa-p03-012)", async () => {
    const repo = await createFixtureRepo("mutation-e2e-stage-");
    try {
      await writeFile(repo.path, "file-a.txt", "initial a\n");
      await writeFile(repo.path, "file-b.txt", "initial b\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);

      await writeFile(repo.path, "file-a.txt", "modified a\n");
      await writeFile(repo.path, "file-b.txt", "modified b\n");

      const result = await client.callTool({
        name: "git_stage",
        arguments: { repo_path: repo.path, paths: ["file-a.txt"] },
      });
      assert.equal(result.isError, undefined);
      const stage = parseToolResult(result) as GitStageResult;
      assert.deepEqual(stage.staged_paths, ["file-a.txt"]);

      const status = parseToolResult(
        await client.callTool({ name: "git_status", arguments: { repo_path: repo.path } }),
      ) as GitStatusResult;

      const entryA = status.entries.find((e) => e.path === "file-a.txt");
      const entryB = status.entries.find((e) => e.path === "file-b.txt");
      assert.ok(entryA, "file-a.txt should exist in status entries");
      assert.ok(entryB, "file-b.txt should exist in status entries");
      assert.equal(entryA.staged_status, "modified");
      assert.equal(entryA.unstaged_status, "unmodified");
      assert.equal(entryB.staged_status, "unmodified");
      assert.equal(entryB.unstaged_status, "modified");
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p03-013 @e2e
  it("unstages a selected path through the assembled server (@qa-p03-013)", async () => {
    const repo = await createFixtureRepo("mutation-e2e-unstage-");
    try {
      await writeFile(repo.path, "file-a.txt", "initial a\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);

      await writeFile(repo.path, "file-a.txt", "modified a\n");
      await git(repo.path, ["add", "file-a.txt"]);

      const result = await client.callTool({
        name: "git_unstage",
        arguments: { repo_path: repo.path, paths: ["file-a.txt"] },
      });
      assert.equal(result.isError, undefined);
      const unstage = parseToolResult(result) as GitUnstageResult;
      assert.deepEqual(unstage.unstaged_paths, ["file-a.txt"]);

      const status = parseToolResult(
        await client.callTool({ name: "git_status", arguments: { repo_path: repo.path } }),
      ) as GitStatusResult;

      const entryA = status.entries.find((e) => e.path === "file-a.txt");
      assert.ok(entryA, "file-a.txt should exist in status entries");
      assert.equal(entryA.staged_status, "unmodified");
      assert.equal(entryA.unstaged_status, "modified");
      const content = await fs.readFile(path.join(repo.path, "file-a.txt"), "utf8");
      assert.equal(content, "modified a\n");
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p03-014 @e2e
  it("restores a selected path through the assembled server (@qa-p03-014)", async () => {
    const repo = await createFixtureRepo("mutation-e2e-restore-");
    try {
      await writeFile(repo.path, "file-a.txt", "indexed content\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);

      await writeFile(repo.path, "file-a.txt", "dirty content\n");

      const result = await client.callTool({
        name: "git_restore",
        arguments: { repo_path: repo.path, paths: ["file-a.txt"] },
      });
      assert.equal(result.isError, undefined);
      const restore = parseToolResult(result) as GitRestoreResult;
      assert.deepEqual(restore.restored_paths, ["file-a.txt"]);

      const content = await fs.readFile(path.join(repo.path, "file-a.txt"), "utf8");
      assert.equal(content.replace(/\r\n/g, "\n"), "indexed content\n");
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p03-015 @e2e
  it("commits staged changes through the assembled server (@qa-p03-015)", async () => {
    const repo = await createFixtureRepo("mutation-e2e-commit-");
    try {
      await writeFile(repo.path, "file-a.txt", "initial\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "Initial commit"]);

      await writeFile(repo.path, "file-a.txt", "staged update\n");
      await git(repo.path, ["add", "file-a.txt"]);

      const result = await client.callTool({
        name: "git_commit",
        arguments: {
          repo_path: repo.path,
          subject: "feat: add discrete commit",
          body: "Extended commit body description.",
          footers: ["Refs: #456"],
        },
      });
      assert.equal(result.isError, undefined);
      const commit = parseToolResult(result) as GitCommitResult;
      assert.equal(commit.subject, "feat: add discrete commit");
      assert.match(commit.commit_sha, /^[0-9a-f]{40}$/);

      const logOutput = await git(repo.path, ["log", "-1", "--format=%B"]);
      assert.ok(logOutput.includes("feat: add discrete commit"));
      assert.ok(logOutput.includes("Extended commit body description."));
      assert.ok(logOutput.includes("Refs: #456"));
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p03-016 @e2e
  it("rejects malformed mutation input with InvalidParams protocol error (@qa-p03-016)", async () => {
    const repo = await createFixtureRepo("mutation-e2e-malformed-");
    try {
      await writeFile(repo.path, "README.md", "hello\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "init"]);
      const porcelainBefore = await git(repo.path, ["status", "--porcelain"]);

      await assert.rejects(
        async () => {
          await client.callTool({
            name: "git_stage",
            arguments: { repo_path: repo.path, paths: "invalid-not-array" as unknown as string[] },
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof Error);
          const errorWithCode = err as { code?: number; message?: string };
          assert.ok(
            errorWithCode.code === -32602 ||
              (errorWithCode.message && errorWithCode.message.includes("Invalid arguments")),
            `Expected InvalidParams error, got: ${String(err)}`,
          );
          return true;
        },
      );

      const porcelainAfter = await git(repo.path, ["status", "--porcelain"]);
      assert.equal(porcelainAfter, porcelainBefore);
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p03-017 @e2e
  it("rejects unsafe restore without changing repository contents (@qa-p03-017)", async () => {
    const repo = await createFixtureRepo("mutation-e2e-unsafe-restore-");
    try {
      await writeFile(repo.path, "README.md", "original\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "init"]);

      await writeFile(repo.path, "README.md", "modified content\n");
      const porcelainBefore = await git(repo.path, ["status", "--porcelain"]);

      const result = await client.callTool({
        name: "git_restore",
        arguments: { repo_path: repo.path, paths: ["*"] },
      });
      assert.equal(result.isError, true);
      const textItem = (result.content as TextContentItem[]).find((item) => item.type === "text");
      assert.ok(textItem?.text.includes("confirm: true"));

      const porcelainAfter = await git(repo.path, ["status", "--porcelain"]);
      assert.equal(porcelainAfter, porcelainBefore);
      const content = await fs.readFile(path.join(repo.path, "README.md"), "utf8");
      assert.equal(content, "modified content\n");
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p03-018 @e2e
  it("rejects empty commit without changing repository history (@qa-p03-018)", async () => {
    const repo = await createFixtureRepo("mutation-e2e-empty-commit-");
    try {
      await writeFile(repo.path, "README.md", "original\n");
      await git(repo.path, ["add", "."]);
      await git(repo.path, ["commit", "-m", "init"]);

      const headBefore = (await git(repo.path, ["rev-parse", "HEAD"])).trim();

      const result = await client.callTool({
        name: "git_commit",
        arguments: { repo_path: repo.path, subject: "feat: should fail without changes" },
      });
      assert.equal(result.isError, true);
      const textItem = (result.content as TextContentItem[]).find((item) => item.type === "text");
      assert.ok(textItem?.text.includes("No staged changes are present"));

      const headAfter = (await git(repo.path, ["rev-parse", "HEAD"])).trim();
      assert.equal(headAfter, headBefore);
    } finally {
      await repo.cleanup();
    }
  });

  // @qa-p03-019 @e2e
  it("handles invalid repository requests without terminating the server (@qa-p03-019)", async () => {
    const tmpNonGit = path.join(packageRoot, "temp-non-git-dir");
    await fs.mkdir(tmpNonGit, { recursive: true });
    try {
      const result = await client.callTool({
        name: "git_stage",
        arguments: { repo_path: tmpNonGit, paths: ["any.txt"] },
      });
      assert.equal(result.isError, true);
      const textItem = (result.content as TextContentItem[]).find((item) => item.type === "text");
      assert.ok(textItem && textItem.text.length > 0);

      // Verify server remains responsive for subsequent valid tool call
      const repo = await createFixtureRepo("mutation-e2e-healthy-subsequent-");
      try {
        await writeFile(repo.path, "subsequent.txt", "content\n");
        const validResult = await client.callTool({
          name: "git_stage",
          arguments: { repo_path: repo.path, paths: ["subsequent.txt"] },
        });
        assert.equal(validResult.isError, undefined);
        const stage = parseToolResult(validResult) as GitStageResult;
        assert.deepEqual(stage.staged_paths, ["subsequent.txt"]);
      } finally {
        await repo.cleanup();
      }
    } finally {
      await fs.rm(tmpNonGit, { recursive: true, force: true });
    }
  });
});
