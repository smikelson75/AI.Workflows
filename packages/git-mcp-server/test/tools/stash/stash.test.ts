import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { GitExecutor } from "../../../src/git/executor.js";
import { GitStashInputSchema } from "../../../src/models/workspace.js";
import { executeGitStash } from "../../../src/tools/stash/stash.js";
import { createFixtureRepo } from "../../helpers/fixture-repo.js";

describe("git_stash tool", () => {
  describe("input schema validation", () => {
    it("validates a request with action 'list'", () => {
      const parsed = GitStashInputSchema.parse({ action: "list" });
      assert.equal(parsed.action, "list");
    });

    it("validates a request with action 'push' and include_untracked", () => {
      const parsed = GitStashInputSchema.parse({
        action: "push",
        include_untracked: true,
      });
      assert.equal(parsed.action, "push");
      assert.equal(parsed.include_untracked, true);
    });

    it("validates a request with action 'pop' and stash_index", () => {
      const parsed = GitStashInputSchema.parse({
        action: "pop",
        stash_index: 0,
      });
      assert.equal(parsed.action, "pop");
      assert.equal(parsed.stash_index, 0);
    });

    it("validates a request with action 'drop' and stash_index", () => {
      const parsed = GitStashInputSchema.parse({
        action: "drop",
        stash_index: 1,
      });
      assert.equal(parsed.action, "drop");
      assert.equal(parsed.stash_index, 1);
    });

    it("rejects a request with a missing action field", () => {
      assert.throws(() => {
        GitStashInputSchema.parse({});
      });
    });

    it("rejects an invalid action", () => {
      assert.throws(() => {
        GitStashInputSchema.parse({ action: "invalid_action" });
      });
    });

    it("rejects a negative stash_index", () => {
      assert.throws(() => {
        GitStashInputSchema.parse({ action: "pop", stash_index: -1 });
      });
    });

    it("rejects a non-integer stash_index", () => {
      assert.throws(() => {
        GitStashInputSchema.parse({ action: "pop", stash_index: 1.5 });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitStashInputSchema.parse({
          action: "list",
          unexpected_option: true,
        });
      });
    });
  });

  describe("basic functionality", () => {
    it("lists, pushes, pops, and drops stashes in isolation", async () => {
      const fixture = await createFixtureRepo("git-stash-e2e-");
      const executor = new GitExecutor();
      try {
        // Create initial commit
        await fs.writeFile(path.join(fixture.path, "README.md"), "initial");
        await executor.exec(["add", "README.md"], { cwd: fixture.path });
        await executor.exec(["commit", "-m", "initial commit"], { cwd: fixture.path });

        // List when empty
        let result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "list",
        });
        if (result.action !== "list") {
          assert.fail("expected list result");
        }
        assert.equal(result.entries.length, 0);

        // Push a stash
        await fs.writeFile(path.join(fixture.path, "work.txt"), "work");
        await executor.exec(["add", "work.txt"], { cwd: fixture.path });
        result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "push",
        });
        if (result.action !== "push") {
          assert.fail("expected push result");
        }
        assert(result.stash_id.includes("stash@"));

        // List with one stash
        result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "list",
        });
        if (result.action !== "list") {
          assert.fail("expected list result");
        }
        assert.equal(result.entries.length, 1);

        // Pop the stash
        result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "pop",
          stash_index: 0,
        });
        if (result.action !== "pop") {
          assert.fail("expected pop result");
        }
        assert.equal(result.success, true);

        // Verify file is restored
        const content = await fs.readFile(path.join(fixture.path, "work.txt"), "utf-8");
        assert.equal(content, "work");

        // Push another stash and drop it
        await fs.writeFile(path.join(fixture.path, "temp.txt"), "temporary");
        await executor.exec(["add", "temp.txt"], { cwd: fixture.path });
        result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "push",
        });
        if (result.action !== "push") {
          assert.fail("expected push result");
        }

        // Drop the stash
        result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "drop",
          stash_index: 0,
        });
        if (result.action !== "drop") {
          assert.fail("expected drop result");
        }

        // Verify stash is gone
        result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "list",
        });
        if (result.action !== "list") {
          assert.fail("expected list result");
        }
        assert.equal(result.entries.length, 0);
      } finally {
        await fixture.cleanup();
      }
    });

    it("supports include_untracked flag on push", async () => {
      const fixture = await createFixtureRepo("git-stash-untracked-");
      const executor = new GitExecutor();
      try {
        await fs.writeFile(path.join(fixture.path, "README.md"), "initial");
        await executor.exec(["add", "README.md"], { cwd: fixture.path });
        await executor.exec(["commit", "-m", "initial commit"], { cwd: fixture.path });

        // Create tracked and untracked files
        await fs.writeFile(path.join(fixture.path, "tracked.txt"), "tracked");
        await executor.exec(["add", "tracked.txt"], { cwd: fixture.path });
        await fs.writeFile(path.join(fixture.path, "untracked.txt"), "untracked");

        // Push with include_untracked
        const result = await executeGitStash(executor, {
          repo_path: fixture.path,
          action: "push",
          include_untracked: true,
        });

        if (result.action !== "push") {
          assert.fail("expected push result");
        }

        // Verify untracked file is gone
        const exists = await fs
          .access(path.join(fixture.path, "untracked.txt"))
          .then(() => true)
          .catch(() => false);
        assert.equal(exists, false);
      } finally {
        await fixture.cleanup();
      }
    });
  });
});
