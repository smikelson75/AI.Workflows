import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GitExecutor } from "../../src/git/executor.js";
import { GitLogInputSchema, type GitLogResult } from "../../src/models/inspection.js";
import { GitMcpServer } from "../../src/server.js";
import { executeGitLog, parseGitLog } from "../../src/tools/inspection/log.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_log tool", () => {
  describe("parseGitLog unit parsing", () => {
    it("parses delimited stream output with full commit metadata and changed files", () => {
      const rawOutput = [
        "\x1e1234567890123456789012345678901234567890\x1f1234567\x1fJane Doe\x1fjane@example.com\x1f2026-09-12T10:00:00Z\x1ffeat(core): initial feature\x1fDetailed explanation of feature.\nLine 2 of body.\x1fsrc/index.ts\nREADME.md\n",
        "\x1eabcdef1234567890abcdef1234567890abcdef12\x1fabcdef1\x1fBob Smith\x1fbob@example.com\x1f2026-09-11T09:00:00Z\x1fdocs: update readme\x1f\x1fREADME.md\n",
      ].join("");

      const commits = parseGitLog(rawOutput);
      assert.equal(commits.length, 2);

      assert.deepEqual(commits[0], {
        hash: "1234567890123456789012345678901234567890",
        short_hash: "1234567",
        author: "Jane Doe <jane@example.com>",
        author_name: "Jane Doe",
        author_email: "jane@example.com",
        date: "2026-09-12T10:00:00Z",
        subject: "feat(core): initial feature",
        body: "Detailed explanation of feature.\nLine 2 of body.",
        files_changed: ["src/index.ts", "README.md"],
      });

      assert.deepEqual(commits[1], {
        hash: "abcdef1234567890abcdef1234567890abcdef12",
        short_hash: "abcdef1",
        author: "Bob Smith <bob@example.com>",
        author_name: "Bob Smith",
        author_email: "bob@example.com",
        date: "2026-09-11T09:00:00Z",
        subject: "docs: update readme",
        body: "",
        files_changed: ["README.md"],
      });
    });

    it("parses standard git log output format", () => {
      const rawStandardLog = [
        "commit 1111111111111111111111111111111111111111",
        "Author: Alice Wonder <alice@example.com>",
        "Date:   Sat Sep 12 12:00:00 2026 +0000",
        "",
        "    feat: add log parsing",
        "",
        "    Supports multiple log formats seamlessly.",
        "",
        "src/log.ts",
        "test/log.test.ts",
        "",
        "commit 2222222222222222222222222222222222222222",
        "Author: Bob Builder <bob@example.com>",
        "Date:   Fri Sep 11 11:00:00 2026 +0000",
        "",
        "    initial commit",
        "",
        "package.json",
      ].join("\n");

      const commits = parseGitLog(rawStandardLog);
      assert.equal(commits.length, 2);

      assert.equal(commits[0]?.hash, "1111111111111111111111111111111111111111");
      assert.equal(commits[0]?.short_hash, "1111111");
      assert.equal(commits[0]?.author, "Alice Wonder <alice@example.com>");
      assert.equal(commits[0]?.author_name, "Alice Wonder");
      assert.equal(commits[0]?.author_email, "alice@example.com");
      assert.equal(commits[0]?.subject, "feat: add log parsing");
      assert.equal(commits[0]?.body, "Supports multiple log formats seamlessly.");
      assert.deepEqual(commits[0]?.files_changed, ["src/log.ts", "test/log.test.ts"]);

      assert.equal(commits[1]?.hash, "2222222222222222222222222222222222222222");
      assert.equal(commits[1]?.subject, "initial commit");
      assert.deepEqual(commits[1]?.files_changed, ["package.json"]);
    });

    it("returns empty array for empty string", () => {
      assert.deepEqual(parseGitLog(""), []);
      assert.deepEqual(parseGitLog("   \n  "), []);
    });
  });

  describe("input schema validation", () => {
    it("validates empty options successfully", () => {
      const parsed = GitLogInputSchema.safeParse({});
      assert.equal(parsed.success, true);
    });

    it("validates valid options with pagination and filters", () => {
      const parsed = GitLogInputSchema.safeParse({
        repo_path: "/tmp/repo",
        max_count: 5,
        skip: 2,
        revision_range: "HEAD~3..HEAD",
        paths: ["src/index.ts"],
        author: "Alice",
        since: "2026-01-01",
      });
      assert.equal(parsed.success, true);
    });

    it("rejects non-positive max_count", () => {
      const parsed = GitLogInputSchema.safeParse({
        max_count: -1,
      });
      assert.equal(parsed.success, false);
    });

    it("rejects negative skip", () => {
      const parsed = GitLogInputSchema.safeParse({
        skip: -5,
      });
      assert.equal(parsed.success, false);
    });

    it("rejects unknown parameters in strict mode", () => {
      const parsed = GitLogInputSchema.safeParse({
        extra_option: "unexpected",
      });
      assert.equal(parsed.success, false);
    });
  });

  describe("fixture repository execution", () => {
    let repo: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      repo = await createFixtureRepo("git-log-test-");
      executor = new GitExecutor();
    });

    after(async () => {
      await repo.cleanup();
    });

    it("returns empty commits list on an empty repository without commits", async () => {
      const result = await executeGitLog(executor, { repo_path: repo.path });
      assert.equal(result.total, 0);
      assert.deepEqual(result.commits, []);
    });

    it("inspects single initial commit with subject, body, and touched files", async () => {
      await fs.writeFile(path.join(repo.path, "file1.txt"), "first version\n");
      await executor.exec(["add", "file1.txt"], { cwd: repo.path });
      await executor.exec(["commit", "-m", "feat: initial commit\n\nDetailed body explanation."], {
        cwd: repo.path,
      });

      const result = await executeGitLog(executor, { repo_path: repo.path });
      assert.equal(result.total, 1);
      const commit = result.commits[0];
      assert.ok(commit.hash.length === 40);
      assert.equal(commit.subject, "feat: initial commit");
      assert.equal(commit.body, "Detailed body explanation.");
      assert.ok(commit.author.includes("Test User"));
      assert.ok(commit.date.length > 0);
      assert.deepEqual(commit.files_changed, ["file1.txt"]);
    });

    it("retrieves multiple commits in reverse chronological order", async () => {
      await fs.writeFile(path.join(repo.path, "file2.txt"), "second file\n");
      await executor.exec(["add", "file2.txt"], { cwd: repo.path });
      await executor.exec(["commit", "-m", "feat: second commit"], { cwd: repo.path });

      await fs.writeFile(path.join(repo.path, "file3.txt"), "third file\n");
      await executor.exec(["add", "file3.txt"], { cwd: repo.path });
      await executor.exec(["commit", "-m", "feat: third commit"], { cwd: repo.path });

      const result = await executeGitLog(executor, { repo_path: repo.path });
      assert.equal(result.total, 3);
      assert.equal(result.commits[0]?.subject, "feat: third commit");
      assert.equal(result.commits[1]?.subject, "feat: second commit");
      assert.equal(result.commits[2]?.subject, "feat: initial commit");
    });

    it("respects max_count pagination constraint", async () => {
      const result = await executeGitLog(executor, {
        repo_path: repo.path,
        max_count: 2,
      });
      assert.equal(result.total, 2);
      assert.equal(result.commits.length, 2);
      assert.equal(result.commits[0]?.subject, "feat: third commit");
      assert.equal(result.commits[1]?.subject, "feat: second commit");
    });

    it("respects skip pagination constraint", async () => {
      const result = await executeGitLog(executor, {
        repo_path: repo.path,
        skip: 1,
        max_count: 1,
      });
      assert.equal(result.total, 1);
      assert.equal(result.commits[0]?.subject, "feat: second commit");
    });

    it("scopes log to specific file path", async () => {
      const result = await executeGitLog(executor, {
        repo_path: repo.path,
        paths: ["file1.txt"],
      });
      assert.equal(result.total, 1);
      assert.equal(result.commits[0]?.subject, "feat: initial commit");
      assert.deepEqual(result.commits[0]?.files_changed, ["file1.txt"]);
    });

    it("respects revision_range constraint", async () => {
      const result = await executeGitLog(executor, {
        repo_path: repo.path,
        revision_range: "HEAD~2..HEAD",
      });
      assert.equal(result.total, 2);
      assert.equal(result.commits[0]?.subject, "feat: third commit");
      assert.equal(result.commits[1]?.subject, "feat: second commit");
    });
  });

  describe("MCP client tool call protocol integration", () => {
    let repo: FixtureRepo;
    let serverInstance: GitMcpServer;
    let client: Client;
    let clientTransport: InMemoryTransport;
    let serverTransport: InMemoryTransport;

    before(async () => {
      repo = await createFixtureRepo("git-log-mcp-");
      await fs.writeFile(path.join(repo.path, "readme.md"), "# Log MCP Test\n");
      const executor = new GitExecutor();
      await executor.exec(["add", "."], { cwd: repo.path });
      await executor.exec(["commit", "-m", "docs: init repo"], { cwd: repo.path });

      serverInstance = new GitMcpServer();
      client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
      [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([serverInstance.connect(serverTransport), client.connect(clientTransport)]);
    });

    after(async () => {
      await client.close();
      await serverInstance.close();
      await repo.cleanup();
    });

    it("lists git_log among registered tools", async () => {
      const tools = await client.listTools();
      const logTool = tools.tools.find((t) => t.name === "git_log");
      assert.ok(logTool, "git_log tool must be registered");
      assert.equal(logTool.name, "git_log");
    });

    it("calls git_log via MCP protocol and receives structured JSON", async () => {
      const res = await client.callTool({
        name: "git_log",
        arguments: {
          repo_path: repo.path,
        },
      });

      assert.equal(res.isError, undefined);
      assert.ok(Array.isArray(res.content));
      assert.ok(res.content.length > 0);

      const content = res.content as Array<{ type: string; text?: string }>;
      const textItem = content.find((c) => c.type === "text");
      assert.ok(textItem && typeof textItem.text === "string");
      const parsed = JSON.parse(textItem.text) as GitLogResult;
      assert.equal(parsed.total, 1);
      assert.equal(parsed.commits[0]?.subject, "docs: init repo");
    });

    it("rejects call with invalid parameters with McpError InvalidParams", async () => {
      await assert.rejects(
        async () => {
          await client.callTool({
            name: "git_log",
            arguments: {
              max_count: -10,
            },
          });
        },
        (error: unknown) => {
          assert.ok(error instanceof McpError);
          assert.equal(error.code, ErrorCode.InvalidParams);
          return true;
        },
      );
    });
  });
});
