import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../../src/artifacts/repo-root.js";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";
import { createFixtureRepo } from "../helpers/fixture-repo.js";

/**
 * Exercises resolveRepoRoot across all its success and failure paths in one
 * pass against real temporary Git repositories and the real git binary, to
 * prove the artifact-layer boundary works together end-to-end.
 */
test("resolveRepoRoot integration: success and failure paths across one shared environment", async () => {
  const repo = await createFixtureRepo("verification-integration-");
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "verification-integration-non-git-"));
  const filePath = path.join(tmpDir, "file.txt");
  await fs.writeFile(filePath, "content");
  const missingPath = path.join(
    os.tmpdir(),
    `verification-integration-missing-${String(Date.now())}`,
  );

  try {
    // success: repo root itself
    const rootResult = await resolveRepoRoot(repo.path);
    assert.ok(rootResult.path.length > 0);
    assert.ok(!rootResult.path.includes("\\"));

    // success: nested subdirectory resolves to the same top level
    const nested = path.join(repo.path, "nested", "dir");
    await fs.mkdir(nested, { recursive: true });
    const nestedResult = await resolveRepoRoot(nested);
    assert.equal(nestedResult.path, rootResult.path);

    // failure: missing repo_path
    await assert.rejects(
      () => resolveRepoRoot(undefined),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_MISSING);
        return true;
      },
    );

    // failure: empty repo_path
    await assert.rejects(
      () => resolveRepoRoot(""),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_MISSING);
        return true;
      },
    );

    // failure: non-existent path
    await assert.rejects(
      () => resolveRepoRoot(missingPath),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_FOUND);
        return true;
      },
    );

    // failure: path is a file, not a directory
    await assert.rejects(
      () => resolveRepoRoot(filePath),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_A_DIRECTORY);
        return true;
      },
    );

    // failure: directory outside any git repository
    await assert.rejects(
      () => resolveRepoRoot(tmpDir),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_A_GIT_REPOSITORY);
        return true;
      },
    );
  } finally {
    await repo.cleanup();
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("resolveRepoRoot integration: resolution does not depend on the caller's current directory", async () => {
  const repo = await createFixtureRepo("verification-integration-cwd-");
  const unrelatedDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "verification-integration-unrelated-"),
  );
  const originalCwd = process.cwd();
  try {
    process.chdir(unrelatedDir);
    const result = await resolveRepoRoot(repo.path);
    process.chdir(originalCwd);
    const resultFromInside = await resolveRepoRoot(repo.path);

    assert.equal(result.path, resultFromInside.path);
  } finally {
    process.chdir(originalCwd);
    await repo.cleanup();
    await fs.rm(unrelatedDir, { recursive: true, force: true });
  }
});

test("resolveRepoRoot integration: reports the same normalized root for Windows-style and POSIX-style input", async () => {
  const repo = await createFixtureRepo("verification-integration-normalize-");
  try {
    const posixInput = repo.path.replace(/\\/g, "/");
    const windowsStyleInput = repo.path.replace(/\//g, "\\");

    const posixResult = await resolveRepoRoot(posixInput);
    const windowsResult = await resolveRepoRoot(windowsStyleInput);

    assert.equal(posixResult.path, windowsResult.path);
  } finally {
    await repo.cleanup();
  }
});
