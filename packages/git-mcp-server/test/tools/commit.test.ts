import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { GitExecutor } from "../../src/git/executor.js";
import { GitCommitInputSchema } from "../../src/models/mutation.js";
import { executeGitStage } from "../../src/tools/mutation/stage.js";
import { composeCommitMessage, executeGitCommit } from "../../src/tools/mutation/commit.js";
import { createFixtureRepo, type FixtureRepo } from "../helpers/fixture-repo.js";

describe("git_commit tool", () => {
  describe("input schema validation", () => {
    it("validates a request with only a subject", () => {
      const parsed = GitCommitInputSchema.parse({ subject: "feat: add feature" });
      assert.equal(parsed.subject, "feat: add feature");
    });

    it("rejects a request with a missing subject field", () => {
      assert.throws(() => {
        GitCommitInputSchema.parse({});
      });
    });

    it("rejects an empty subject string", () => {
      assert.throws(() => {
        GitCommitInputSchema.parse({ subject: "" });
      });
    });

    it("rejects unknown parameters in strict mode", () => {
      assert.throws(() => {
        GitCommitInputSchema.parse({ subject: "feat: add feature", unexpected_option: true });
      });
    });
  });

  describe("composeCommitMessage", () => {
    it("composes a subject-only message", () => {
      assert.equal(composeCommitMessage("feat: add feature"), "feat: add feature");
    });

    it("composes a subject and body separated by a blank line", () => {
      assert.equal(
        composeCommitMessage("feat: add feature", "Body line one.\nBody line two."),
        "feat: add feature\n\nBody line one.\nBody line two.",
      );
    });

    it("composes a subject, body, and footers as distinct sections without escaping corruption", () => {
      const message = composeCommitMessage("feat: add feature", "Body text.", [
        "Refs: #123",
        "BREAKING CHANGE: changes the API.",
      ]);
      assert.equal(
        message,
        "feat: add feature\n\nBody text.\n\nRefs: #123\nBREAKING CHANGE: changes the API.",
      );
    });

    it("omits the body section when body is undefined or blank", () => {
      assert.equal(
        composeCommitMessage("feat: add feature", "", ["Refs: #123"]),
        "feat: add feature\n\nRefs: #123",
      );
    });
  });

  describe("fixture repository execution", () => {
    let fixture: FixtureRepo;
    let executor: GitExecutor;

    before(async () => {
      fixture = await createFixtureRepo("git-commit-test-");
      executor = new GitExecutor();
      await fs.writeFile(path.join(fixture.path, "README.md"), "initial");
      await executor.exec(["add", "README.md"], { cwd: fixture.path });
      await executor.exec(["commit", "-m", "initial commit"], { cwd: fixture.path });
    });

    after(async () => {
      await fixture.cleanup();
    });

    it("rejects an empty commit attempt without an explicit override", async () => {
      await assert.rejects(
        executeGitCommit(executor, { repo_path: fixture.path, subject: "feat: no-op" }),
        /No staged changes are present/,
      );
    });

    it("creates a commit with a multi-line message from subject, body, and footers", async () => {
      await fs.writeFile(path.join(fixture.path, "feature.txt"), "content");
      await executeGitStage(executor, { repo_path: fixture.path, paths: ["feature.txt"] });

      const result = await executeGitCommit(executor, {
        repo_path: fixture.path,
        subject: "feat: add feature file",
        body: "Adds a new feature file to the repository.",
        footers: ["Refs: #42"],
      });

      assert.equal(result.subject, "feat: add feature file");
      assert.equal(result.amended, false);
      assert.match(result.commit_sha, /^[0-9a-f]{40}$/);

      const logResult = await executor.exec(["log", "-1", "--pretty=%B"], {
        cwd: fixture.path,
      });
      assert.equal(
        logResult.stdout.trim(),
        "feat: add feature file\n\nAdds a new feature file to the repository.\n\nRefs: #42",
      );
    });

    it("allows an empty commit when allow_empty is true", async () => {
      const result = await executeGitCommit(executor, {
        repo_path: fixture.path,
        subject: "chore: empty marker commit",
        allow_empty: true,
      });

      assert.equal(result.amended, false);
      const logResult = await executor.exec(["log", "-1", "--pretty=%B"], {
        cwd: fixture.path,
      });
      assert.equal(logResult.stdout.trim(), "chore: empty marker commit");
    });

    it("amends the previous commit with updated staged changes and message", async () => {
      await fs.writeFile(path.join(fixture.path, "amend-target.txt"), "v1");
      await executeGitStage(executor, { repo_path: fixture.path, paths: ["amend-target.txt"] });
      await executeGitCommit(executor, {
        repo_path: fixture.path,
        subject: "feat: original message",
      });

      await fs.writeFile(path.join(fixture.path, "amend-target.txt"), "v2");
      await executeGitStage(executor, { repo_path: fixture.path, paths: ["amend-target.txt"] });

      const beforeLog = await executor.exec(["log", "--oneline"], { cwd: fixture.path });
      const commitCountBefore = beforeLog.stdout.trim().split("\n").length;

      const result = await executeGitCommit(executor, {
        repo_path: fixture.path,
        subject: "feat: amended message",
        amend: true,
      });

      assert.equal(result.amended, true);

      const afterLog = await executor.exec(["log", "--oneline"], { cwd: fixture.path });
      const commitCountAfter = afterLog.stdout.trim().split("\n").length;
      assert.equal(commitCountAfter, commitCountBefore);

      const logResult = await executor.exec(["log", "-1", "--pretty=%B"], {
        cwd: fixture.path,
      });
      assert.equal(logResult.stdout.trim(), "feat: amended message");

      const content = await fs.readFile(path.join(fixture.path, "amend-target.txt"), "utf8");
      assert.equal(content, "v2");
    });
  });
});
