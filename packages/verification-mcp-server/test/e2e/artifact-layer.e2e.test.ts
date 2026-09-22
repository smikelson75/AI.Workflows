import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readPhaseArtifact, readSliceArtifact } from "../../src/artifacts/artifact-reader.js";
import { resolveRepoRoot } from "../../src/artifacts/repo-root.js";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";
import { frontmatterDocument, writeArtifactFile } from "../helpers/artifact-fixture.js";
import { createFixtureRepo } from "../helpers/fixture-repo.js";
import { snapshotTree } from "../helpers/fixture-snapshot.js";

/**
 * qa-p05-018: reads a complete phase and all of its slices end to end
 * against a realistic Git fixture repository.
 */
test("e2e: reads a complete phase and all of its slices from a realistic repository", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    await fs.mkdir(path.join(repo.path, "out"), { recursive: true });
    await writeArtifactFile(
      repo.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        sliceIds: ["slice-01", "slice-02"],
        acceptanceChecks: ["qa-p05-018"],
      }),
    );
    await writeArtifactFile(
      repo.path,
      "phase-05",
      "slice-01-first-slice.md",
      frontmatterDocument({
        sliceId: "slice-01",
        phaseId: "phase-05",
        kind: "behavior",
        filesInScope: ["src/a.ts"],
        unitVerificationCommand: "npm test",
        acceptanceChecks: ["qa-p05-018"],
      }),
    );
    await writeArtifactFile(
      repo.path,
      "phase-05",
      "slice-02-second-slice.md",
      frontmatterDocument({
        sliceId: "slice-02",
        phaseId: "phase-05",
        kind: "non_behavior",
        filesInScope: ["src/b.ts"],
        unitVerificationCommand: "npm test",
        acceptanceChecks: ["qa-p05-018"],
      }),
    );

    const repoRoot = await resolveRepoRoot(repo.path);
    const phase = await readPhaseArtifact(repoRoot, "phase-05");
    const slices = await Promise.all(
      phase.frontmatter.sliceIds.map((sliceId) => readSliceArtifact(repoRoot, "phase-05", sliceId)),
    );

    assert.equal(phase.frontmatter.phaseId, "phase-05");
    assert.deepEqual(
      slices.map((slice) => slice.frontmatter.sliceId).sort(),
      [...phase.frontmatter.sliceIds].sort(),
    );
  } finally {
    await repo.cleanup();
  }
});

/**
 * qa-p05-019 and the repo_path failure contracts: every rejected request
 * leaves the fixture repository byte-identical.
 */
test("e2e: rejects a missing repo_path and leaves the repository unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    const before = await snapshotTree(repo.path);
    await assert.rejects(
      () => resolveRepoRoot(undefined),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_MISSING);
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), before);
  } finally {
    await repo.cleanup();
  }
});

test("e2e: rejects a non-existent repo_path and leaves the repository unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  const missingPath = path.join(os.tmpdir(), `verification-e2e-missing-${String(Date.now())}`);
  try {
    const before = await snapshotTree(repo.path);
    await assert.rejects(
      () => resolveRepoRoot(missingPath),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_FOUND);
        assert.equal(error.details.repoPath, missingPath);
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), before);
  } finally {
    await repo.cleanup();
  }
});

test("e2e: rejects a repo_path that is a file and leaves both directories unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "verification-e2e-file-"));
  const filePath = path.join(tmpDir, "file.txt");
  await fs.writeFile(filePath, "content");
  try {
    const beforeRepo = await snapshotTree(repo.path);
    const beforeFile = await fs.readFile(filePath, "utf8");
    await assert.rejects(
      () => resolveRepoRoot(filePath),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_A_DIRECTORY);
        assert.equal(error.details.repoPath, filePath);
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), beforeRepo);
    assert.equal(await fs.readFile(filePath, "utf8"), beforeFile);
  } finally {
    await repo.cleanup();
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("e2e: rejects a repo_path outside any repository and leaves both directories unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "verification-e2e-non-git-"));
  try {
    const beforeRepo = await snapshotTree(repo.path);
    const beforeTmp = await snapshotTree(tmpDir);
    await assert.rejects(
      () => resolveRepoRoot(tmpDir),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.REPO_PATH_NOT_A_GIT_REPOSITORY);
        assert.equal(error.details.repoPath, tmpDir);
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), beforeRepo);
    assert.deepEqual(await snapshotTree(tmpDir), beforeTmp);
  } finally {
    await repo.cleanup();
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("e2e: rejects an artifact without frontmatter and leaves the repository unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    await writeArtifactFile(repo.path, "phase-05", "phase.md", "Just a prose document.\n");
    const repoRoot = await resolveRepoRoot(repo.path);
    const before = await snapshotTree(repo.path);
    await assert.rejects(
      () => readPhaseArtifact(repoRoot, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING);
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), before);
  } finally {
    await repo.cleanup();
  }
});

test("e2e: rejects an artifact with unparsable YAML and leaves the repository unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    await writeArtifactFile(
      repo.path,
      "phase-05",
      "phase.md",
      "---\nphaseId: [unclosed\n---\nBody.\n",
    );
    const repoRoot = await resolveRepoRoot(repo.path);
    const before = await snapshotTree(repo.path);
    await assert.rejects(
      () => readPhaseArtifact(repoRoot, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_UNPARSABLE);
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), before);
  } finally {
    await repo.cleanup();
  }
});

test("e2e: rejects an artifact missing a required field and leaves the repository unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    await writeArtifactFile(
      repo.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({ phaseId: "phase-05", acceptanceChecks: ["qa-p05-015"] }),
    );
    const repoRoot = await resolveRepoRoot(repo.path);
    const before = await snapshotTree(repo.path);
    await assert.rejects(
      () => readPhaseArtifact(repoRoot, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_INVALID);
        assert.equal(error.details.field, "sliceIds");
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), before);
  } finally {
    await repo.cleanup();
  }
});

test("e2e: rejects an artifact with an unknown field and leaves the repository unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    await writeArtifactFile(
      repo.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        sliceIds: ["slice-01"],
        acceptanceChecks: ["qa-p05-016"],
        unexpectedField: "surprise",
      }),
    );
    const repoRoot = await resolveRepoRoot(repo.path);
    const before = await snapshotTree(repo.path);
    await assert.rejects(
      () => readPhaseArtifact(repoRoot, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_UNKNOWN);
        assert.equal(error.details.field, "unexpectedField");
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), before);
  } finally {
    await repo.cleanup();
  }
});

test("e2e: rejects a request for a missing artifact and leaves the repository unchanged", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    const repoRoot = await resolveRepoRoot(repo.path);
    const before = await snapshotTree(repo.path);
    await assert.rejects(
      () => readPhaseArtifact(repoRoot, "phase-99"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_NOT_FOUND);
        return true;
      },
    );
    assert.deepEqual(await snapshotTree(repo.path), before);
  } finally {
    await repo.cleanup();
  }
});

/**
 * qa-p05-020: the caller remains usable after a rejected request.
 */
test("e2e: remains usable after a rejected request, returning the well-formed artifact afterward", async () => {
  const repo = await createFixtureRepo("verification-e2e-");
  try {
    await writeArtifactFile(repo.path, "phase-05", "phase.md", "Just a prose document.\n");
    await writeArtifactFile(
      repo.path,
      "phase-06",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-06",
        sliceIds: ["slice-01"],
        acceptanceChecks: ["qa-p05-020"],
      }),
    );
    const repoRoot = await resolveRepoRoot(repo.path);

    await assert.rejects(
      () => readPhaseArtifact(repoRoot, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING);
        return true;
      },
    );

    const wellFormed = await readPhaseArtifact(repoRoot, "phase-06");
    assert.equal(wellFormed.frontmatter.phaseId, "phase-06");
    assert.deepEqual(wellFormed.frontmatter.sliceIds, ["slice-01"]);
  } finally {
    await repo.cleanup();
  }
});
