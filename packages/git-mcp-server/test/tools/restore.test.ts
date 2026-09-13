import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { GitExecutor } from "../../src/git/executor.js";
import { GitRestoreInputSchema } from "../../src/models/mutation.js";
import { executeGitStage } from "../../src/tools/mutation/stage.js";
import { executeGitRestore, isBroadOrWildcardPath } from "../../src/tools/mutation/restore.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_restore tool", () => {
  describe("input schema validation", () => {
    it("validates a request with explicit paths", () => {
      const parsed = GitRestoreInputSchema.parse({ paths: ["a.txt"] });
      assert.deepEqual(parsed.paths, ["a.txt"]);
    });

    it("rejects a request with a missing paths field", () => {
      assert.throws(() => {
        GitRestoreInputSchema.parse({});
      });
    });

    it("rejects an empty paths array", () => {
      assert.throws(() => {
        GitRestoreInputSchema.parse({ paths: [] });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitRestoreInputSchema.parse({ paths: ["a.txt"], unexpected_option: true });
      });
    });
  });

  describe("isBroadOrWildcardPath", () => {
    it("flags broad or wildcard-only paths", () => {
      assert.equal(isBroadOrWildcardPath("."), true);
      assert.equal(isBroadOrWildcardPath("./"), true);
      assert.equal(isBroadOrWildcardPath("*"), true);
      assert.equal(isBroadOrWildcardPath("**"), true);
      assert.equal(isBroadOrWildcardPath("**/*"), true);
      assert.equal(isBroadOrWildcardPath("src/*.ts"), true);
    });

    it("does not flag explicit file paths", () => {
      assert.equal(isBroadOrWildcardPath("a.txt"), false);
      assert.equal(isBroadOrWildcardPath("src/index.ts"), false);
    });
  });

  describe("fixture repository execution", () => {
    let fixture: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      fixture = await createFixtureRepo("git-restore-test-");
      executor = new GitExecutor();
      await fs.writeFile(path.join(fixture.path, "README.md"), "initial");
      await executor.exec(["add", "README.md"], { cwd: fixture.path });
      await executor.exec(["commit", "-m", "initial commit"], { cwd: fixture.path });
    });

    after(async () => {
      await fixture.cleanup();
    });

    it("reverts working tree modifications for an explicit path to the last indexed state", async () => {
      const filePath = path.join(fixture.path, "README.md");
      await fs.writeFile(filePath, "modified content");

      const result = await executeGitRestore(executor, {
        repo_path: fixture.path,
        paths: ["README.md"],
      });

      assert.deepEqual(result.restored_paths, ["README.md"]);
      const content = await fs.readFile(filePath, "utf8");
      assert.equal(content, "initial");
    });

    it("rejects a broad or wildcard-only path request without confirm", async () => {
      await fs.writeFile(path.join(fixture.path, "README.md"), "modified again");

      await assert.rejects(
        executeGitRestore(executor, {
          repo_path: fixture.path,
          paths: ["*"],
        }),
        /require 'confirm: true'/,
      );

      const content = await fs.readFile(path.join(fixture.path, "README.md"), "utf8");
      assert.equal(content, "modified again");
    });

    it("allows a broad or wildcard-only path request when confirm is true", async () => {
      await fs.writeFile(path.join(fixture.path, "README.md"), "modified once more");

      await executeGitRestore(executor, {
        repo_path: fixture.path,
        paths: ["*"],
        confirm: true,
      });

      const content = await fs.readFile(path.join(fixture.path, "README.md"), "utf8");
      assert.equal(content, "initial");
    });

    it("rejects path traversal attempts before invoking git restore", async () => {
      await assert.rejects(
        executeGitRestore(executor, {
          repo_path: fixture.path,
          paths: ["../outside.txt"],
        }),
        /resolves outside the repository root/,
      );
    });

    it("only unstages nothing and restores just the working tree for the named path", async () => {
      const filePath = path.join(fixture.path, "tracked.txt");
      await fs.writeFile(filePath, "content");
      await executeGitStage(executor, { repo_path: fixture.path, paths: ["tracked.txt"] });
      await executor.exec(["commit", "-m", "add tracked file"], { cwd: fixture.path });

      await fs.writeFile(filePath, "changed content");
      await executeGitRestore(executor, {
        repo_path: fixture.path,
        paths: ["tracked.txt"],
      });

      const content = await fs.readFile(filePath, "utf8");
      assert.equal(content, "content");
    });
  });
});
