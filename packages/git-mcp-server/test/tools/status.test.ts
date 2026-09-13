import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GitExecutor } from "../../src/git/executor.js";
import { GitStatusInputSchema } from "../../src/models/inspection.js";
import { GitMcpServer } from "../../src/server.js";
import {
  executeGitStatus,
  mapStatusCodeChar,
  parsePorcelainStatus,
} from "../../src/tools/inspection/status.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_status tool", () => {
  describe("mapStatusCodeChar", () => {
    it("maps standard status characters correctly", () => {
      assert.equal(mapStatusCodeChar(" "), "unmodified");
      assert.equal(mapStatusCodeChar("."), "unmodified");
      assert.equal(mapStatusCodeChar("M"), "modified");
      assert.equal(mapStatusCodeChar("A"), "added");
      assert.equal(mapStatusCodeChar("D"), "deleted");
      assert.equal(mapStatusCodeChar("R"), "renamed");
      assert.equal(mapStatusCodeChar("C"), "copied");
      assert.equal(mapStatusCodeChar("U"), "unmerged");
      assert.equal(mapStatusCodeChar("?"), "untracked");
      assert.equal(mapStatusCodeChar("!"), "ignored");
      assert.equal(mapStatusCodeChar("T"), "type_changed");
      assert.equal(mapStatusCodeChar("Z"), "unknown");
    });
  });

  describe("parsePorcelainStatus unit parsing", () => {
    it("parses porcelain v1 lines accurately", () => {
      const rawOutput = [
        "## main...origin/main [ahead 1]",
        " M unstaged-mod.txt",
        "M  staged-mod.txt",
        "MM both-mod.txt",
        "A  staged-new.txt",
        "AM staged-new-unstaged-mod.txt",
        "D  staged-deleted.txt",
        " D unstaged-deleted.txt",
        "R  old-name.txt -> new-name.txt",
        "C  source.txt -> copy.txt",
        "?? untracked.txt",
        "!! ignored.log",
        "UU conflict.txt",
        ' M "quoted path with spaces.txt"',
        "",
      ].join("\n");

      const parsed = parsePorcelainStatus(rawOutput);

      assert.equal(parsed.length, 13);

      assert.deepEqual(parsed[0], {
        path: "unstaged-mod.txt",
        status_code: " M",
        staged_status: "unmodified",
        unstaged_status: "modified",
      });

      assert.deepEqual(parsed[1], {
        path: "staged-mod.txt",
        status_code: "M ",
        staged_status: "modified",
        unstaged_status: "unmodified",
      });

      assert.deepEqual(parsed[2], {
        path: "both-mod.txt",
        status_code: "MM",
        staged_status: "modified",
        unstaged_status: "modified",
      });

      assert.deepEqual(parsed[3], {
        path: "staged-new.txt",
        status_code: "A ",
        staged_status: "added",
        unstaged_status: "unmodified",
      });

      assert.deepEqual(parsed[4], {
        path: "staged-new-unstaged-mod.txt",
        status_code: "AM",
        staged_status: "added",
        unstaged_status: "modified",
      });

      assert.deepEqual(parsed[5], {
        path: "staged-deleted.txt",
        status_code: "D ",
        staged_status: "deleted",
        unstaged_status: "unmodified",
      });

      assert.deepEqual(parsed[6], {
        path: "unstaged-deleted.txt",
        status_code: " D",
        staged_status: "unmodified",
        unstaged_status: "deleted",
      });

      assert.deepEqual(parsed[7], {
        path: "new-name.txt",
        orig_path: "old-name.txt",
        status_code: "R ",
        staged_status: "renamed",
        unstaged_status: "unmodified",
      });

      assert.deepEqual(parsed[8], {
        path: "copy.txt",
        orig_path: "source.txt",
        status_code: "C ",
        staged_status: "copied",
        unstaged_status: "unmodified",
      });

      assert.deepEqual(parsed[9], {
        path: "untracked.txt",
        status_code: "??",
        staged_status: "untracked",
        unstaged_status: "untracked",
      });

      assert.deepEqual(parsed[10], {
        path: "ignored.log",
        status_code: "!!",
        staged_status: "ignored",
        unstaged_status: "ignored",
      });

      assert.deepEqual(parsed[11], {
        path: "conflict.txt",
        status_code: "UU",
        staged_status: "unmerged",
        unstaged_status: "unmerged",
      });

      assert.deepEqual(parsed[12], {
        path: "quoted path with spaces.txt",
        status_code: " M",
        staged_status: "unmodified",
        unstaged_status: "modified",
      });
    });

    it("parses porcelain v2 lines accurately", () => {
      const rawOutput = [
        "# branch.oid 1234567890abcdef1234567890abcdef12345678",
        "# branch.head main",
        "1 M. N... 100644 100644 100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 ordinary.txt",
        "2 R. N... 100644 100644 100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 R100 dest.txt\tsrc.txt",
        "u UU N... 100644 100644 100644 100644 hash hash hash unmerged.txt",
        "? untracked-v2.txt",
        "! ignored-v2.log",
      ].join("\n");

      const parsed = parsePorcelainStatus(rawOutput);

      assert.equal(parsed.length, 5);

      assert.deepEqual(parsed[0], {
        path: "ordinary.txt",
        status_code: "M ",
        staged_status: "modified",
        unstaged_status: "unmodified",
      });

      assert.deepEqual(parsed[1], {
        path: "dest.txt",
        orig_path: "src.txt",
        status_code: "R ",
        staged_status: "renamed",
        unstaged_status: "unmodified",
      });

      assert.deepEqual(parsed[2], {
        path: "unmerged.txt",
        status_code: "UU",
        staged_status: "unmerged",
        unstaged_status: "unmerged",
      });

      assert.deepEqual(parsed[3], {
        path: "untracked-v2.txt",
        status_code: "??",
        staged_status: "untracked",
        unstaged_status: "untracked",
      });

      assert.deepEqual(parsed[4], {
        path: "ignored-v2.log",
        status_code: "!!",
        staged_status: "ignored",
        unstaged_status: "ignored",
      });
    });
  });

  describe("input schema validation", () => {
    it("validates empty options successfully", () => {
      const parsed = GitStatusInputSchema.parse({});
      assert.deepEqual(parsed, {});
    });

    it("validates valid options with untracked_files and ignored", () => {
      const parsed = GitStatusInputSchema.parse({
        repo_path: "/workspace/repo",
        untracked_files: "all",
        ignored: true,
      });
      assert.equal(parsed.repo_path, "/workspace/repo");
      assert.equal(parsed.untracked_files, "all");
      assert.equal(parsed.ignored, true);
    });

    it("rejects invalid untracked_files mode", () => {
      assert.throws(() => {
        GitStatusInputSchema.parse({
          untracked_files: "invalid-mode",
        });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitStatusInputSchema.parse({
          unexpected_option: true,
        });
      });
    });
  });

  describe("fixture repository execution", () => {
    let fixture: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      fixture = await createFixtureRepo("git-status-test-");
      executor = new GitExecutor();
    });

    after(async () => {
      await fixture.cleanup();
    });

    it("reports is_clean: true on an empty clean repository", async () => {
      const status = await executeGitStatus(executor, { repo_path: fixture.path });
      assert.equal(status.is_clean, true);
      assert.equal(status.entries.length, 0);
    });

    it("detects untracked file and sets is_clean: false", async () => {
      const filePath = path.join(fixture.path, "new-file.txt");
      await fs.writeFile(filePath, "hello world\n", "utf8");

      const status = await executeGitStatus(executor, { repo_path: fixture.path });
      assert.equal(status.is_clean, false);
      assert.equal(status.entries.length, 1);
      assert.equal(status.entries[0]?.path, "new-file.txt");
      assert.equal(status.entries[0]?.status_code, "??");
      assert.equal(status.entries[0]?.staged_status, "untracked");
      assert.equal(status.entries[0]?.unstaged_status, "untracked");
    });

    it("detects staged added file (A )", async () => {
      await executor.exec(["add", "new-file.txt"], { cwd: fixture.path });

      const status = await executeGitStatus(executor, { repo_path: fixture.path });
      assert.equal(status.is_clean, false);
      assert.equal(status.entries.length, 1);
      assert.equal(status.entries[0]?.status_code, "A ");
      assert.equal(status.entries[0]?.staged_status, "added");
      assert.equal(status.entries[0]?.unstaged_status, "unmodified");
    });

    it("detects staged added and unstaged modified (AM)", async () => {
      const filePath = path.join(fixture.path, "new-file.txt");
      await fs.appendFile(filePath, "extra line\n", "utf8");

      const status = await executeGitStatus(executor, { repo_path: fixture.path });
      assert.equal(status.is_clean, false);
      assert.equal(status.entries.length, 1);
      assert.equal(status.entries[0]?.status_code, "AM");
      assert.equal(status.entries[0]?.staged_status, "added");
      assert.equal(status.entries[0]?.unstaged_status, "modified");
    });

    it("detects staged rename (R ) after commit", async () => {
      // Stage unstaged changes and commit the file first
      await executor.exec(["add", "new-file.txt"], { cwd: fixture.path });
      await executor.exec(["commit", "-m", "initial commit"], { cwd: fixture.path });

      // Rename with git mv
      await executor.exec(["mv", "new-file.txt", "renamed-file.txt"], { cwd: fixture.path });

      const status = await executeGitStatus(executor, { repo_path: fixture.path });
      assert.equal(status.is_clean, false);
      assert.equal(status.entries.length, 1);
      assert.equal(status.entries[0]?.status_code, "R ");
      assert.equal(status.entries[0]?.staged_status, "renamed");
      assert.equal(status.entries[0]?.path, "renamed-file.txt");
      assert.equal(status.entries[0]?.orig_path, "new-file.txt");

      // Commit the rename
      await executor.exec(["commit", "-m", "rename commit"], { cwd: fixture.path });
    });

    it("supports untracked_files: 'no' flag to ignore untracked files", async () => {
      const untrackedPath = path.join(fixture.path, "another-untracked.txt");
      await fs.writeFile(untrackedPath, "temp\n", "utf8");

      const statusWithUntracked = await executeGitStatus(executor, {
        repo_path: fixture.path,
        untracked_files: "all",
      });
      assert.equal(statusWithUntracked.entries.length, 1);

      const statusWithoutUntracked = await executeGitStatus(executor, {
        repo_path: fixture.path,
        untracked_files: "no",
      });
      assert.equal(statusWithoutUntracked.entries.length, 0);

      await fs.unlink(untrackedPath);
    });

    it("supports ignored files flag", async () => {
      const gitignorePath = path.join(fixture.path, ".gitignore");
      await fs.writeFile(gitignorePath, "*.log\n", "utf8");
      await executor.exec(["add", ".gitignore"], { cwd: fixture.path });
      await executor.exec(["commit", "-m", "add gitignore"], { cwd: fixture.path });

      const logPath = path.join(fixture.path, "debug.log");
      await fs.writeFile(logPath, "log content\n", "utf8");

      const statusWithoutIgnored = await executeGitStatus(executor, {
        repo_path: fixture.path,
        ignored: false,
      });
      assert.equal(statusWithoutIgnored.entries.length, 0);
      assert.equal(statusWithoutIgnored.is_clean, true);

      const statusWithIgnored = await executeGitStatus(executor, {
        repo_path: fixture.path,
        ignored: true,
      });
      assert.equal(statusWithIgnored.entries.length, 1);
      assert.equal(statusWithIgnored.entries[0]?.status_code, "!!");
      assert.equal(statusWithIgnored.entries[0]?.staged_status, "ignored");
      // Even with ignored files present, repo is clean
      assert.equal(statusWithIgnored.is_clean, true);
    });
  });

  describe("MCP client tool call protocol integration", () => {
    let serverInstance: GitMcpServer;
    let client: Client;
    let fixture: FixtureRepo;

    before(async () => {
      fixture = await createFixtureRepo("git-status-mcp-test-");
      serverInstance = new GitMcpServer();
      client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([serverInstance.connect(serverTransport), client.connect(clientTransport)]);
    });

    after(async () => {
      await client.close();
      await serverInstance.close();
      await fixture.cleanup();
    });

    it("lists git_status among registered tools", async () => {
      const tools = await client.listTools();
      const statusTool = tools.tools.find((t) => t.name === "git_status");
      assert.ok(statusTool, "git_status must be listed in registered tools");
      assert.equal(statusTool.name, "git_status");
      assert.ok(statusTool.description?.includes("status"));
    });

    it("calls git_status via MCP protocol and receives structured JSON", async () => {
      const testFile = path.join(fixture.path, "file.txt");
      await fs.writeFile(testFile, "data\n", "utf8");

      const response = await client.callTool({
        name: "git_status",
        arguments: {
          repo_path: fixture.path,
          untracked_files: "normal",
        },
      });

      assert.equal(response.isError, undefined);
      assert.ok(Array.isArray(response.content));
      assert.equal(response.content.length, 1);

      const content = response.content as Array<{ type: string; text: string }>;
      assert.equal(content[0]?.type, "text");

      const parsedResult = JSON.parse(content[0]?.text ?? "{}") as {
        is_clean: boolean;
        entries: Array<{ path: string; status_code: string }>;
      };

      assert.equal(parsedResult.is_clean, false);
      assert.equal(parsedResult.entries.length, 1);
      assert.equal(parsedResult.entries[0]?.path, "file.txt");
      assert.equal(parsedResult.entries[0]?.status_code, "??");
    });

    it("rejects call with invalid parameters with McpError InvalidParams", async () => {
      await assert.rejects(
        async () => {
          await client.callTool({
            name: "git_status",
            arguments: {
              untracked_files: "unrecognized_option",
            },
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof McpError);
          assert.equal(err.code, ErrorCode.InvalidParams);
          return true;
        },
      );
    });
  });
});
