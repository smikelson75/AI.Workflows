import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { GitExecutor } from "../../src/git/executor.js";
import { GitStageInputSchema } from "../../src/models/mutation.js";
import { executeGitStage, resolvePathWithinRepo } from "../../src/tools/mutation/stage.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_stage tool", () => {
  describe("input schema validation", () => {
    it("validates a request with explicit paths", () => {
      const parsed = GitStageInputSchema.parse({ paths: ["a.txt", "b.txt"] });
      assert.deepEqual(parsed.paths, ["a.txt", "b.txt"]);
    });

    it("validates a request with all: true", () => {
      const parsed = GitStageInputSchema.parse({ all: true });
      assert.equal(parsed.all, true);
    });

    it("rejects a request with neither paths nor all", () => {
      assert.throws(() => {
        GitStageInputSchema.parse({});
      });
    });

    it("rejects an empty paths array", () => {
      assert.throws(() => {
        GitStageInputSchema.parse({ paths: [] });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitStageInputSchema.parse({ paths: ["a.txt"], unexpected_option: true });
      });
    });
  });

  describe("resolvePathWithinRepo", () => {
    it("allows paths within the repository root", () => {
      const repoRoot = process.cwd().replace(/\\/g, "/");
      const resolved = resolvePathWithinRepo(repoRoot, process.cwd(), "src/file.txt");
      assert.equal(resolved.replace(/\\/g, "/"), `${repoRoot}/src/file.txt`);
    });

    it("rejects traversal paths outside the repository root", () => {
      const repoRoot = process.cwd().replace(/\\/g, "/");
      assert.throws(() => {
        resolvePathWithinRepo(repoRoot, process.cwd(), "../outside.txt");
      });
    });
  });

  describe("fixture repository execution", () => {
    let fixture: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      fixture = await createFixtureRepo("git-stage-test-");
      executor = new GitExecutor();
    });

    after(async () => {
      await fixture.cleanup();
    });

    it("stages explicit paths", async () => {
      await fs.writeFile(path.join(fixture.path, "explicit.txt"), "content");

      const result = await executeGitStage(executor, {
        repo_path: fixture.path,
        paths: ["explicit.txt"],
      });

      assert.equal(result.all, false);
      assert.deepEqual(result.staged_paths, ["explicit.txt"]);

      const statusResult = await executor.exec(["status", "--porcelain=v1"], {
        cwd: fixture.path,
      });
      assert.match(statusResult.stdout, /^A {2}explicit\.txt/m);
    });

    it("stages all modified and untracked files when all: true", async () => {
      await fs.writeFile(path.join(fixture.path, "all-1.txt"), "content");
      await fs.writeFile(path.join(fixture.path, "all-2.txt"), "content");

      const result = await executeGitStage(executor, {
        repo_path: fixture.path,
        all: true,
      });

      assert.equal(result.all, true);
      assert.deepEqual(result.staged_paths, []);

      const statusResult = await executor.exec(["status", "--porcelain=v1"], {
        cwd: fixture.path,
      });
      assert.match(statusResult.stdout, /^A {2}all-1\.txt/m);
      assert.match(statusResult.stdout, /^A {2}all-2\.txt/m);
    });

    it("rejects path traversal attempts before invoking git add", async () => {
      await assert.rejects(
        executeGitStage(executor, {
          repo_path: fixture.path,
          paths: ["../outside.txt"],
        }),
        /resolves outside the repository root/,
      );
    });
  });
});
