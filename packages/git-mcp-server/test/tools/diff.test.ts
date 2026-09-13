import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GitExecutor } from "../../src/git/executor.js";
import { GitDiffInputSchema, type GitDiffResult } from "../../src/models/inspection.js";
import { GitMcpServer } from "../../src/server.js";
import {
  executeGitDiff,
  normalizePath,
  parseDiffCheck,
  parseDiffStat,
  parseNumstat,
  parseUnifiedDiffStats,
} from "../../src/tools/inspection/diff.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_diff tool", () => {
  describe("path normalization", () => {
    it("normalizes backslashes to forward slashes", () => {
      assert.equal(normalizePath("src\\foo\\bar.ts"), "src/foo/bar.ts");
    });

    it("removes surrounding double quotes", () => {
      assert.equal(normalizePath('"quoted/path with spaces.txt"'), "quoted/path with spaces.txt");
    });
  });

  describe("parseUnifiedDiffStats unit parsing", () => {
    it("parses unified diff and counts insertions and deletions across files", () => {
      const diffOutput = [
        "diff --git a/file1.txt b/file1.txt",
        "index 1111111..2222222 100644",
        "--- a/file1.txt",
        "+++ b/file1.txt",
        "@@ -1,3 +1,4 @@",
        " line1",
        "-line2",
        "+line2_mod",
        "+line3",
        "diff --git a/file2.txt b/file2.txt",
        "index 3333333..4444444 100644",
        "--- a/file2.txt",
        "+++ b/file2.txt",
        "@@ -1,4 +1,2 @@",
        "-old1",
        "-old2",
        " keep",
      ].join("\n");

      const stat = parseUnifiedDiffStats(diffOutput);
      assert.equal(stat.files_changed, 2);
      assert.equal(stat.insertions, 2);
      assert.equal(stat.deletions, 3);
      assert.deepEqual(stat.files, [
        { path: "file1.txt", insertions: 2, deletions: 1 },
        { path: "file2.txt", insertions: 0, deletions: 2 },
      ]);
    });

    it("handles binary files in diff output", () => {
      const diffOutput = [
        "diff --git a/image.png b/image.png",
        "new file mode 100644",
        "index 0000000..1111111",
        "Binary files /dev/null and b/image.png differ",
      ].join("\n");

      const stat = parseUnifiedDiffStats(diffOutput);
      assert.equal(stat.files_changed, 1);
      assert.equal(stat.insertions, 0);
      assert.equal(stat.deletions, 0);
      assert.equal(stat.files[0]?.path, "image.png");
      assert.equal(stat.files[0]?.binary, true);
    });
  });

  describe("parseNumstat unit parsing", () => {
    it("parses tab-delimited numstat output lines", () => {
      const numstatOutput = [
        "10\t5\tsrc/index.ts",
        "2\t0\tREADME.md",
        "-\t-\tassets/logo.png",
        "",
      ].join("\n");

      const stat = parseNumstat(numstatOutput);
      assert.equal(stat.files_changed, 3);
      assert.equal(stat.insertions, 12);
      assert.equal(stat.deletions, 5);
      assert.deepEqual(stat.files, [
        { path: "src/index.ts", insertions: 10, deletions: 5 },
        { path: "README.md", insertions: 2, deletions: 0 },
        { path: "assets/logo.png", insertions: 0, deletions: 0, binary: true },
      ]);
    });
  });

  describe("parseDiffStat dispatch", () => {
    it("returns zero counts for empty string", () => {
      const stat = parseDiffStat("");
      assert.equal(stat.files_changed, 0);
      assert.equal(stat.insertions, 0);
      assert.equal(stat.deletions, 0);
      assert.equal(stat.files.length, 0);
    });

    it("detects unified diff and routes accordingly", () => {
      const diffOutput = [
        "diff --git a/a.txt b/a.txt",
        "--- a/a.txt",
        "+++ b/a.txt",
        "@@ -1 +1 @@",
        "-old",
        "+new",
      ].join("\n");
      const stat = parseDiffStat(diffOutput);
      assert.equal(stat.files_changed, 1);
      assert.equal(stat.insertions, 1);
      assert.equal(stat.deletions, 1);
    });
  });

  describe("parseDiffCheck unit parsing", () => {
    it("returns clean check result for empty output", () => {
      const result = parseDiffCheck("", 0);
      assert.equal(result.has_errors, false);
      assert.equal(result.errors.length, 0);
    });

    it("parses whitespace errors with line numbers", () => {
      const checkOutput = [
        "file1.txt:12: trailing whitespace.",
        "file2.txt:5: space before tab in indent.",
        "",
      ].join("\n");
      const result = parseDiffCheck(checkOutput, 1);
      assert.equal(result.has_errors, true);
      assert.equal(result.errors.length, 2);
      assert.deepEqual(result.errors[0], {
        file: "file1.txt",
        line: 12,
        message: "trailing whitespace.",
      });
      assert.deepEqual(result.errors[1], {
        file: "file2.txt",
        line: 5,
        message: "space before tab in indent.",
      });
    });
  });

  describe("input schema validation", () => {
    it("validates empty options successfully", () => {
      const parsed = GitDiffInputSchema.safeParse({});
      assert.equal(parsed.success, true);
    });

    it("validates valid options with mode, staged, and paths", () => {
      const parsed = GitDiffInputSchema.safeParse({
        repo_path: "/tmp/repo",
        mode: "stat",
        staged: true,
        paths: ["src/index.ts"],
        max_lines: 100,
      });
      assert.equal(parsed.success, true);
    });

    it("rejects invalid mode", () => {
      const parsed = GitDiffInputSchema.safeParse({
        mode: "invalid_mode",
      });
      assert.equal(parsed.success, false);
    });

    it("rejects non-positive max_lines", () => {
      const parsed = GitDiffInputSchema.safeParse({
        max_lines: -1,
      });
      assert.equal(parsed.success, false);
    });

    it("rejects unknown parameters in strict mode", () => {
      const parsed = GitDiffInputSchema.safeParse({
        unrecognized_param: true,
      });
      assert.equal(parsed.success, false);
    });
  });

  describe("fixture repository execution", () => {
    let repo: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      repo = await createFixtureRepo("git-diff-test-");
      executor = new GitExecutor();

      // Create initial commit with base files
      await fs.writeFile(path.join(repo.path, "file1.txt"), "hello world\nline 2\n");
      await fs.writeFile(path.join(repo.path, "file2.txt"), "initial content\n");
      await executor.exec(["add", "."], { cwd: repo.path });
      await executor.exec(["commit", "-m", "initial commit"], { cwd: repo.path });
    });

    after(async () => {
      await repo.cleanup();
    });

    it("reports is_clean: true when working tree has no changes", async () => {
      const result = await executeGitDiff(executor, { repo_path: repo.path });
      assert.equal(result.is_clean, true);
      assert.equal(result.mode, "patch");
      assert.equal(result.files?.length, 0);
    });

    it("inspects working tree unstaged modifications in patch mode", async () => {
      await fs.writeFile(
        path.join(repo.path, "file1.txt"),
        "hello world\nline 2 modified\nnew line 3\n",
      );

      const result = await executeGitDiff(executor, {
        repo_path: repo.path,
        mode: "patch",
      });

      assert.equal(result.is_clean, false);
      assert.equal(result.mode, "patch");
      assert.ok(result.patch && result.patch.includes("+line 2 modified"));
      assert.ok(result.files && result.files.includes("file1.txt"));
      assert.ok(result.stat);
      assert.equal(result.stat.files_changed, 1);
    });

    it("inspects working tree modifications in stat mode", async () => {
      const result = await executeGitDiff(executor, {
        repo_path: repo.path,
        mode: "stat",
      });

      assert.equal(result.is_clean, false);
      assert.equal(result.mode, "stat");
      assert.ok(result.stat);
      assert.equal(result.stat.files_changed, 1);
      assert.equal(result.stat.files[0]?.path, "file1.txt");
      assert.ok(result.stat.insertions > 0);
    });

    it("inspects working tree modifications in name_only mode", async () => {
      const result = await executeGitDiff(executor, {
        repo_path: repo.path,
        mode: "name_only",
      });

      assert.equal(result.is_clean, false);
      assert.equal(result.mode, "name_only");
      assert.deepEqual(result.files, ["file1.txt"]);
    });

    it("scopes diff to specific path when path filtering is provided", async () => {
      // Modify file2.txt as well
      await fs.writeFile(path.join(repo.path, "file2.txt"), "initial content\nadditional file2\n");

      const filteredResult = await executeGitDiff(executor, {
        repo_path: repo.path,
        mode: "name_only",
        paths: ["file2.txt"],
      });

      assert.deepEqual(filteredResult.files, ["file2.txt"]);
    });

    it("inspects staged modifications with staged: true in patch and stat modes", async () => {
      // Stage file1.txt
      await executor.exec(["add", "file1.txt"], { cwd: repo.path });

      // Staged diff in patch mode
      const patchResult = await executeGitDiff(executor, {
        repo_path: repo.path,
        staged: true,
        mode: "patch",
      });
      assert.equal(patchResult.staged, true);
      assert.ok(patchResult.patch && patchResult.patch.includes("+line 2 modified"));
      assert.ok(patchResult.files && patchResult.files.includes("file1.txt"));
      assert.ok(!patchResult.files.includes("file2.txt"));

      // Staged diff in stat mode
      const statResult = await executeGitDiff(executor, {
        repo_path: repo.path,
        staged: true,
        mode: "stat",
      });
      assert.equal(statResult.staged, true);
      assert.ok(statResult.stat);
      assert.equal(statResult.stat.files_changed, 1);
      assert.equal(statResult.stat.files[0]?.path, "file1.txt");
    });

    it("truncates patch output when max_lines is exceeded", async () => {
      const result = await executeGitDiff(executor, {
        repo_path: repo.path,
        staged: true,
        mode: "patch",
        max_lines: 3,
      });

      assert.equal(result.is_truncated, true);
      assert.ok(result.patch && result.patch.includes("[Diff output truncated"));
    });

    it("diffs against specific commit reference", async () => {
      const headRev = (
        await executor.exec(["rev-parse", "HEAD"], { cwd: repo.path })
      ).stdout.trim();
      const result = await executeGitDiff(executor, {
        repo_path: repo.path,
        target: headRev,
        mode: "name_only",
      });

      assert.ok(result.files && result.files.includes("file1.txt"));
    });

    it("inspects whitespace issues in check mode", async () => {
      const checkResult = await executeGitDiff(executor, {
        repo_path: repo.path,
        mode: "check",
      });

      assert.ok(checkResult.check);
      assert.equal(typeof checkResult.check.has_errors, "boolean");
    });
  });

  describe("MCP client tool call protocol integration", () => {
    let repo: FixtureRepo;
    let serverInstance: GitMcpServer;
    let client: Client;
    let clientTransport: InMemoryTransport;
    let serverTransport: InMemoryTransport;

    before(async () => {
      repo = await createFixtureRepo("git-diff-mcp-");
      await fs.writeFile(path.join(repo.path, "readme.md"), "# Welcome\n");
      const executor = new GitExecutor();
      await executor.exec(["add", "."], { cwd: repo.path });
      await executor.exec(["commit", "-m", "init"], { cwd: repo.path });
      await fs.writeFile(path.join(repo.path, "readme.md"), "# Welcome\nNew line\n");

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

    it("lists git_diff among registered tools", async () => {
      const tools = await client.listTools();
      const diffTool = tools.tools.find((t) => t.name === "git_diff");
      assert.ok(diffTool, "git_diff tool must be registered");
      assert.equal(diffTool.name, "git_diff");
    });

    it("calls git_diff via MCP protocol and receives structured JSON", async () => {
      const res = await client.callTool({
        name: "git_diff",
        arguments: {
          repo_path: repo.path,
          mode: "name_only",
        },
      });

      assert.equal(res.isError, undefined);
      assert.ok(Array.isArray(res.content));
      assert.ok(res.content.length > 0);

      const content = res.content as Array<{ type: string; text?: string }>;
      const textItem = content.find((c) => c.type === "text");
      assert.ok(textItem && typeof textItem.text === "string");
      const parsed = JSON.parse(textItem.text) as GitDiffResult;
      assert.equal(parsed.mode, "name_only");
      assert.deepEqual(parsed.files, ["readme.md"]);
    });

    it("rejects call with invalid parameters with McpError InvalidParams", async () => {
      await assert.rejects(
        async () => {
          await client.callTool({
            name: "git_diff",
            arguments: {
              mode: "non_existent_mode",
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
