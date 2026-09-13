import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GitExecutor } from "../../src/git/executor.js";
import { GitInfoInputSchema, type GitInfoResult } from "../../src/models/inspection.js";
import { GitMcpServer } from "../../src/server.js";
import { executeGitInfo } from "../../src/tools/inspection/info.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_info tool", () => {
  describe("input schema validation", () => {
    it("validates empty options successfully", () => {
      const parsed = GitInfoInputSchema.parse({});
      assert.deepEqual(parsed, {});
    });

    it("validates valid options with repo_path", () => {
      const parsed = GitInfoInputSchema.parse({
        repo_path: "/workspace/repo",
      });
      assert.equal(parsed.repo_path, "/workspace/repo");
    });

    it("rejects non-string repo_path type", () => {
      assert.throws(() => {
        GitInfoInputSchema.parse({
          repo_path: 12345,
        });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitInfoInputSchema.parse({
          extra_option: "unexpected",
        });
      });
    });
  });

  describe("fixture repository execution", () => {
    let fixture: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      fixture = await createFixtureRepo("git-info-test-");
      executor = new GitExecutor();
    });

    after(async () => {
      await fixture.cleanup();
    });

    it("inspects empty repository metadata before any commit", async () => {
      const info = await executeGitInfo(executor, { repo_path: fixture.path });

      const normalizedExpectedRoot = fixture.path.replace(/\\/g, "/");
      assert.equal(info.repo_root, normalizedExpectedRoot);
      assert.equal(info.current_branch, "main");
      assert.equal(info.head_sha, null);
      assert.equal(info.is_clean, true);
      assert.equal(info.clean, true);
      assert.equal(info.remote_url, null);
      assert.equal(info.remote_origin_url, null);
    });

    it("inspects repository metadata after initial commit", async () => {
      const filePath = path.join(fixture.path, "readme.txt");
      await fs.writeFile(filePath, "init\n", "utf8");
      await executor.exec(["add", "readme.txt"], { cwd: fixture.path });
      await executor.exec(["commit", "-m", "initial commit"], { cwd: fixture.path });

      const info = await executeGitInfo(executor, { repo_path: fixture.path });

      assert.equal(info.current_branch, "main");
      assert.ok(info.head_sha, "HEAD SHA should be populated");
      assert.match(info.head_sha, /^[0-9a-f]{40}$/);
      assert.equal(info.is_clean, true);
      assert.equal(info.clean, true);
    });

    it("reflects uncommitted working tree changes with is_clean: false", async () => {
      const filePath = path.join(fixture.path, "untracked.txt");
      await fs.writeFile(filePath, "changes\n", "utf8");

      const info = await executeGitInfo(executor, { repo_path: fixture.path });
      assert.equal(info.is_clean, false);
      assert.equal(info.clean, false);

      await fs.unlink(filePath);
    });

    it("detects configured remote origin URL", async () => {
      const remoteUrl = "https://github.com/example/sample-repo.git";
      await executor.exec(["remote", "add", "origin", remoteUrl], {
        cwd: fixture.path,
      });

      const info = await executeGitInfo(executor, { repo_path: fixture.path });
      assert.equal(info.remote_url, remoteUrl);
      assert.equal(info.remote_origin_url, remoteUrl);
    });

    it("reports current_branch as null in detached HEAD state", async () => {
      await executor.exec(["checkout", "--detach", "HEAD"], {
        cwd: fixture.path,
      });

      const info = await executeGitInfo(executor, { repo_path: fixture.path });
      assert.equal(info.current_branch, null);
      assert.ok(info.head_sha, "HEAD SHA should still exist in detached HEAD");

      // Return to main branch
      await executor.exec(["checkout", "main"], { cwd: fixture.path });
    });
  });

  describe("MCP client tool call protocol integration", () => {
    let serverInstance: GitMcpServer;
    let client: Client;
    let fixture: FixtureRepo;

    before(async () => {
      fixture = await createFixtureRepo("git-info-mcp-test-");
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

    it("lists git_info among registered tools", async () => {
      const tools = await client.listTools();
      const infoTool = tools.tools.find((t) => t.name === "git_info");
      assert.ok(infoTool, "git_info must be listed in registered tools");
      assert.equal(infoTool.name, "git_info");
      assert.ok(infoTool.description?.includes("repository metadata"));
    });

    it("calls git_info via MCP protocol and receives structured JSON", async () => {
      const response = await client.callTool({
        name: "git_info",
        arguments: {
          repo_path: fixture.path,
        },
      });

      assert.equal(response.isError, undefined);
      assert.ok(Array.isArray(response.content));
      assert.equal(response.content.length, 1);

      const content = response.content as Array<{ type: string; text: string }>;
      assert.equal(content[0]?.type, "text");

      const parsedResult = JSON.parse(content[0]?.text ?? "{}") as GitInfoResult;

      const normalizedExpectedRoot = fixture.path.replace(/\\/g, "/");
      assert.equal(parsedResult.repo_root, normalizedExpectedRoot);
      assert.equal(parsedResult.current_branch, "main");
      assert.equal(parsedResult.head_sha, null);
      assert.equal(parsedResult.is_clean, true);
    });

    it("rejects call with invalid parameters with McpError InvalidParams", async () => {
      await assert.rejects(
        async () => {
          await client.callTool({
            name: "git_info",
            arguments: {
              repo_path: 12345,
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
