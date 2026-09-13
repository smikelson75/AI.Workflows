import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { GitExecutor } from "../../src/git/executor.js";
import { GitUnstageInputSchema } from "../../src/models/mutation.js";
import { executeGitStage } from "../../src/tools/mutation/stage.js";
import { executeGitUnstage } from "../../src/tools/mutation/unstage.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_unstage tool", () => {
  describe("input schema validation", () => {
    it("validates a request with explicit paths", () => {
      const parsed = GitUnstageInputSchema.parse({ paths: ["a.txt"] });
      assert.deepEqual(parsed.paths, ["a.txt"]);
    });

    it("rejects a request with a missing paths field", () => {
      assert.throws(() => {
        GitUnstageInputSchema.parse({});
      });
    });

    it("rejects an empty paths array", () => {
      assert.throws(() => {
        GitUnstageInputSchema.parse({ paths: [] });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitUnstageInputSchema.parse({ paths: ["a.txt"], unexpected_option: true });
      });
    });
  });

  describe("fixture repository execution", () => {
    let fixture: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      fixture = await createFixtureRepo("git-unstage-test-");
      executor = new GitExecutor();
      await fs.writeFile(path.join(fixture.path, "README.md"), "initial");
      await executor.exec(["add", "README.md"], { cwd: fixture.path });
      await executor.exec(["commit", "-m", "initial commit"], { cwd: fixture.path });
    });

    after(async () => {
      await fixture.cleanup();
    });

    it("removes a staged file from the index without discarding working tree changes", async () => {
      const filePath = path.join(fixture.path, "tracked.txt");
      await fs.writeFile(filePath, "content");
      await executeGitStage(executor, { repo_path: fixture.path, paths: ["tracked.txt"] });

      const result = await executeGitUnstage(executor, {
        repo_path: fixture.path,
        paths: ["tracked.txt"],
      });

      assert.deepEqual(result.unstaged_paths, ["tracked.txt"]);

      const statusResult = await executor.exec(["status", "--porcelain=v1"], {
        cwd: fixture.path,
      });
      assert.match(statusResult.stdout, /^\?\? tracked\.txt/m);

      const fileContent = await fs.readFile(filePath, "utf8");
      assert.equal(fileContent, "content");
    });

    it("only unstages the requested paths, leaving other staged files intact", async () => {
      await fs.writeFile(path.join(fixture.path, "keep-staged.txt"), "content");
      await fs.writeFile(path.join(fixture.path, "to-unstage.txt"), "content");
      await executeGitStage(executor, {
        repo_path: fixture.path,
        paths: ["keep-staged.txt", "to-unstage.txt"],
      });

      await executeGitUnstage(executor, {
        repo_path: fixture.path,
        paths: ["to-unstage.txt"],
      });

      const statusResult = await executor.exec(["status", "--porcelain=v1"], {
        cwd: fixture.path,
      });
      assert.match(statusResult.stdout, /^A {2}keep-staged\.txt/m);
      assert.match(statusResult.stdout, /^\?\? to-unstage\.txt/m);
    });

    it("rejects path traversal attempts before invoking git restore", async () => {
      await assert.rejects(
        executeGitUnstage(executor, {
          repo_path: fixture.path,
          paths: ["../outside.txt"],
        }),
        /resolves outside the repository root/,
      );
    });
  });
});
