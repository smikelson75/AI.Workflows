import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { GitExecutor } from "../../../src/git/executor.js";
import { GitBranchInputSchema } from "../../../src/models/workspace.js";
import { executeGitBranch, isValidBranchName } from "../../../src/tools/branch/branch.js";
import { createFixtureRepo, type FixtureRepo } from "../../helpers/fixture-repo.js";

describe("git_branch tool", () => {
  describe("input schema validation", () => {
    it("validates a list request", () => {
      const parsed = GitBranchInputSchema.parse({ action: "list" });
      assert.equal(parsed.action, "list");
    });

    it("validates a create request with a name", () => {
      const parsed = GitBranchInputSchema.parse({ action: "create", name: "feature/x" });
      assert.equal(parsed.name, "feature/x");
    });

    it("rejects a create request missing name", () => {
      assert.throws(() => {
        GitBranchInputSchema.parse({ action: "create" });
      });
    });

    it("rejects a delete request missing name", () => {
      assert.throws(() => {
        GitBranchInputSchema.parse({ action: "delete" });
      });
    });

    it("rejects an unknown action", () => {
      assert.throws(() => {
        GitBranchInputSchema.parse({ action: "rename", name: "x" });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitBranchInputSchema.parse({ action: "list", unexpected_option: true });
      });
    });
  });

  describe("isValidBranchName", () => {
    it("accepts a simple valid name", () => {
      assert.equal(isValidBranchName("feature/new-thing"), true);
    });

    it("rejects an empty name", () => {
      assert.equal(isValidBranchName(""), false);
    });

    it("rejects names with spaces", () => {
      assert.equal(isValidBranchName("bad name"), false);
    });

    it("rejects names with consecutive dots", () => {
      assert.equal(isValidBranchName("bad..name"), false);
    });

    it("rejects names starting with a dot", () => {
      assert.equal(isValidBranchName(".bad"), false);
    });

    it("rejects names ending with .lock", () => {
      assert.equal(isValidBranchName("bad.lock"), false);
    });

    it("rejects names with invalid characters", () => {
      assert.equal(isValidBranchName("bad~name"), false);
      assert.equal(isValidBranchName("bad^name"), false);
      assert.equal(isValidBranchName("bad:name"), false);
      assert.equal(isValidBranchName("bad?name"), false);
      assert.equal(isValidBranchName("bad*name"), false);
      assert.equal(isValidBranchName("bad[name"), false);
    });

    it("rejects a single '@' name", () => {
      assert.equal(isValidBranchName("@"), false);
    });
  });

  describe("fixture repository execution", () => {
    let fixture: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      fixture = await createFixtureRepo("git-branch-test-");
      executor = new GitExecutor();
      await executor.exec(["commit", "--allow-empty", "-m", "initial commit"], {
        cwd: fixture.path,
      });
    });

    after(async () => {
      await fixture.cleanup();
    });

    it("lists branches with the current branch indicated", async () => {
      const result = await executeGitBranch(executor, {
        repo_path: fixture.path,
        action: "list",
      });

      if (result.action !== "list") {
        assert.fail("expected list result");
      }
      assert.equal(result.current_branch, "main");
      const mainEntry = result.branches.find((b) => b.name === "main");
      assert.ok(mainEntry);
      assert.equal(mainEntry.is_current, true);
      assert.equal(mainEntry.is_remote, false);
    });

    it("creates a new branch", async () => {
      const result = await executeGitBranch(executor, {
        repo_path: fixture.path,
        action: "create",
        name: "feature/one",
      });

      if (result.action !== "create") {
        assert.fail("expected create result");
      }
      assert.equal(result.name, "feature/one");

      const listResult = await executeGitBranch(executor, {
        repo_path: fixture.path,
        action: "list",
      });
      if (listResult.action !== "list") {
        assert.fail("expected list result");
      }
      assert.ok(listResult.branches.some((b) => b.name === "feature/one"));
    });

    it("rejects creating a branch with an invalid ref name", async () => {
      await assert.rejects(
        executeGitBranch(executor, {
          repo_path: fixture.path,
          action: "create",
          name: "bad name",
        }),
        /does not conform to Git ref naming rules/,
      );
    });

    it("deletes an existing non-current branch", async () => {
      await executeGitBranch(executor, {
        repo_path: fixture.path,
        action: "create",
        name: "feature/deletable",
      });

      const result = await executeGitBranch(executor, {
        repo_path: fixture.path,
        action: "delete",
        name: "feature/deletable",
      });

      if (result.action !== "delete") {
        assert.fail("expected delete result");
      }
      assert.equal(result.name, "feature/deletable");
      assert.equal(result.forced, false);

      const listResult = await executeGitBranch(executor, {
        repo_path: fixture.path,
        action: "list",
      });
      if (listResult.action !== "list") {
        assert.fail("expected list result");
      }
      assert.ok(!listResult.branches.some((b) => b.name === "feature/deletable"));
    });

    it("rejects deleting the current branch", async () => {
      await assert.rejects(
        executeGitBranch(executor, {
          repo_path: fixture.path,
          action: "delete",
          name: "main",
        }),
        /is the current branch and cannot be deleted/,
      );
    });

    it("rejects deleting a branch that does not exist", async () => {
      await assert.rejects(
        executeGitBranch(executor, {
          repo_path: fixture.path,
          action: "delete",
          name: "does-not-exist",
        }),
        /does not exist and cannot be deleted/,
      );
    });
  });
});
