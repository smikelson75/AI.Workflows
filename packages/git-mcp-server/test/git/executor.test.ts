import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { GitError, GitExecutor, GitTimeoutError } from "../../src/index.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("GitExecutor", () => {
  let fixture: FixtureRepo;

  before(async () => {
    fixture = await createFixtureRepo();
  });

  after(async () => {
    await fixture.cleanup();
  });

  describe("getVersion", () => {
    it("returns git version string containing 'git version'", async () => {
      const executor = new GitExecutor();
      const version = await executor.getVersion();
      assert.match(version, /^git version/i);
    });
  });

  describe("getRepoRoot", () => {
    it("returns normalized repository root path with forward slashes", async () => {
      const executor = new GitExecutor();
      const root = await executor.getRepoRoot(fixture.path);
      const expected = fixture.path.replace(/\\/g, "/");

      assert.equal(root.toLowerCase(), expected.toLowerCase());
      assert.ok(!root.includes("\\"), "Path must not contain backslashes");
    });

    it("discovers repository root when executed from a nested directory", async () => {
      const nestedDir = path.join(fixture.path, "sub1", "sub2");
      await fs.mkdir(nestedDir, { recursive: true });

      const executor = new GitExecutor({ cwd: nestedDir });
      const root = await executor.getRepoRoot();
      const expected = fixture.path.replace(/\\/g, "/");

      assert.equal(root.toLowerCase(), expected.toLowerCase());
    });
  });

  describe("exec error handling", () => {
    it("throws GitError on non-zero exit code with command details and stderr", async () => {
      const executor = new GitExecutor({ cwd: fixture.path });

      await assert.rejects(
        () => executor.exec(["log"]),
        (err: unknown) => {
          assert(err instanceof GitError);
          assert.equal(typeof err.exitCode, "number");
          assert.notEqual(err.exitCode, 0);
          assert.ok(err.stderr.length > 0);
          assert.deepEqual(err.command, ["log"]);
          assert.equal(err.timedOut, false);
          return true;
        },
      );
    });

    it("throws GitError when an unrecognized git command is executed", async () => {
      const executor = new GitExecutor();

      await assert.rejects(
        () => executor.exec(["non-existent-subcommand"]),
        (err: unknown) => {
          assert(err instanceof GitError);
          assert.equal(err.exitCode, 1);
          assert.match(err.stderr, /is not a git command/i);
          assert.deepEqual(err.command, ["non-existent-subcommand"]);
          return true;
        },
      );
    });

    it("throws GitTimeoutError when command exceeds configured timeout", async () => {
      const executor = new GitExecutor();

      await assert.rejects(
        () => executor.exec(["hash-object", "--stdin"], { timeoutMs: 150 }),
        (err: unknown) => {
          assert(err instanceof GitTimeoutError);
          assert(err instanceof GitError);
          assert(err instanceof Error);
          assert.equal(err.timedOut, true);
          assert.equal(err.exitCode, null);
          assert.equal(err.timeoutMs, 150);
          assert.deepEqual(err.command, ["hash-object", "--stdin"]);
          return true;
        },
      );
    });
  });

  describe("security invariants", () => {
    it("passes shell metacharacters literally without shell execution", async () => {
      const executor = new GitExecutor({ cwd: fixture.path });
      const injectedFile = path.join(fixture.path, "pwned.txt");

      await assert.rejects(
        () => executor.exec(["branch", `; echo hacked > "${injectedFile}"`]),
        (err: unknown) => {
          assert(err instanceof GitError);
          assert.match(err.stderr, /not a valid branch name/i);
          return true;
        },
      );

      let fileExists = false;
      try {
        await fs.access(injectedFile);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      assert.equal(fileExists, false, "Shell command must not execute; file must not exist");
    });

    it("treats pipe characters as literal arguments rather than shell piping", async () => {
      const executor = new GitExecutor({ cwd: fixture.path });

      await assert.rejects(
        () => executor.exec(["branch", "| dir"]),
        (err: unknown) => {
          assert(err instanceof GitError);
          assert.match(err.stderr, /not a valid branch name/i);
          return true;
        },
      );
    });
  });

  describe("successful execution", () => {
    it("executes valid git status command and returns exitCode 0", async () => {
      const executor = new GitExecutor({ cwd: fixture.path });
      const result = await executor.exec(["status", "--porcelain"]);

      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr, "");
    });

    it("merges custom environment variables", async () => {
      const executor = new GitExecutor({ cwd: fixture.path });
      const result = await executor.exec(["status"], {
        env: { TEST_ENV_VAR: "1" },
      });

      assert.equal(result.exitCode, 0);
    });
  });
});
