import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../../src/artifacts/repo-root.js";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";
import { createFixtureRepo } from "../helpers/fixture-repo.js";

test("resolves the top-level path of a temporary git repository", async () => {
  const repo = await createFixtureRepo();
  try {
    const result = await resolveRepoRoot(repo.path);
    assert.ok(result.path.length > 0);
    assert.ok(!result.path.includes("\\"));
  } finally {
    await repo.cleanup();
  }
});

test("resolves a nested subdirectory to the same repository top level", async () => {
  const repo = await createFixtureRepo();
  try {
    const nested = path.join(repo.path, "nested", "dir");
    await fs.mkdir(nested, { recursive: true });

    const rootResult = await resolveRepoRoot(repo.path);
    const nestedResult = await resolveRepoRoot(nested);

    assert.equal(nestedResult.path, rootResult.path);
  } finally {
    await repo.cleanup();
  }
});

test("rejects an absent repo_path without resolving", async () => {
  await assert.rejects(
    // Absent repo_path fails before any git process is spawned.
    () => resolveRepoRoot(undefined),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.REPO_PATH_MISSING);
      assert.equal(error.message, "repo_path is required and must be a non-empty string");
      assert.deepEqual(error.details, { repoPath: null });
      return true;
    },
  );
});

test("rejects an empty repo_path", async () => {
  await assert.rejects(
    () => resolveRepoRoot(""),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.REPO_PATH_MISSING);
      assert.equal(error.message, "repo_path is required and must be a non-empty string");
      assert.deepEqual(error.details, { repoPath: "" });
      return true;
    },
  );
});

test("rejects a whitespace-only repo_path", async () => {
  await assert.rejects(
    () => resolveRepoRoot("   "),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.REPO_PATH_MISSING);
      assert.equal(error.message, "repo_path is required and must be a non-empty string");
      assert.deepEqual(error.details, { repoPath: "   " });
      return true;
    },
  );
});

test("rejects a non-existent path", async () => {
  const missingPath = path.join(os.tmpdir(), `verification-missing-${String(Date.now())}`);
  await assert.rejects(
    () => resolveRepoRoot(missingPath),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_FOUND);
      assert.equal(error.message, `repo_path does not exist: ${missingPath}`);
      assert.deepEqual(error.details, { repoPath: missingPath });
      return true;
    },
  );
});

test("rejects a path that is a file rather than a directory", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "verification-file-"));
  const filePath = path.join(tmpDir, "file.txt");
  await fs.writeFile(filePath, "content");
  try {
    await assert.rejects(
      () => resolveRepoRoot(filePath),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_A_DIRECTORY);
        assert.equal(error.message, `repo_path is not a directory: ${filePath}`);
        assert.deepEqual(error.details, { repoPath: filePath });
        return true;
      },
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("rejects a directory outside any git repository", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "verification-non-git-"));
  try {
    await assert.rejects(
      () => resolveRepoRoot(tmpDir),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_A_GIT_REPOSITORY);
        assert.equal(error.message, `repo_path is not inside a Git repository: ${tmpDir}`);
        assert.deepEqual(error.details, { repoPath: tmpDir });
        return true;
      },
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
