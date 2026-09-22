import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { readPhaseArtifact, readSliceArtifact } from "../../src/artifacts/artifact-reader.js";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";
import {
  createArtifactFixtureRoot,
  frontmatterDocument,
  writeArtifactFile,
} from "../helpers/artifact-fixture.js";

test("reads a well-formed phase artifact and returns its declared fields", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        sliceIds: ["slice-01", "slice-02"],
        acceptanceChecks: ["qa-p05-001"],
      }),
    );

    const artifact = await readPhaseArtifact({ path: root.path }, "phase-05");

    assert.equal(artifact.frontmatter.phaseId, "phase-05");
    assert.deepEqual(artifact.frontmatter.sliceIds, ["slice-01", "slice-02"]);
    assert.deepEqual(artifact.frontmatter.acceptanceChecks, ["qa-p05-001"]);
    assert.equal(artifact.body, "Prose body.\n");
  } finally {
    await root.cleanup();
  }
});

test("reads a well-formed slice artifact and returns its declared fields", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    await writeArtifactFile(
      root.path,
      "phase-05",
      "slice-03-frontmatter-artifact-reads.md",
      frontmatterDocument({
        sliceId: "slice-03",
        phaseId: "phase-05",
        kind: "behavior",
        filesInScope: ["src/artifacts/artifact-reader.ts"],
        unitVerificationCommand: "npm test",
        integrationVerificationCommand: "npm run test:integration",
        acceptanceChecks: ["qa-p05-010"],
      }),
    );

    const artifact = await readSliceArtifact({ path: root.path }, "phase-05", "slice-03");

    assert.equal(artifact.frontmatter.sliceId, "slice-03");
    assert.equal(artifact.frontmatter.phaseId, "phase-05");
    assert.equal(artifact.frontmatter.kind, "behavior");
    assert.deepEqual(artifact.frontmatter.filesInScope, ["src/artifacts/artifact-reader.ts"]);
    assert.equal(artifact.frontmatter.unitVerificationCommand, "npm test");
    assert.equal(artifact.frontmatter.integrationVerificationCommand, "npm run test:integration");
  } finally {
    await root.cleanup();
  }
});

test("returns the document body unchanged, never derived from frontmatter", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    await writeArtifactFile(
      root.path,
      "phase-05",
      "slice-03-frontmatter-artifact-reads.md",
      frontmatterDocument(
        {
          sliceId: "slice-03",
          phaseId: "phase-05",
          kind: "behavior",
          filesInScope: ["src/artifacts/artifact-reader.ts"],
          unitVerificationCommand: "npm test",
          acceptanceChecks: ["qa-p05-010"],
        },
        "The kind is actually non_behavior according to this prose.\n",
      ),
    );

    const artifact = await readSliceArtifact({ path: root.path }, "phase-05", "slice-03");

    assert.equal(artifact.frontmatter.kind, "behavior");
    assert.equal(artifact.body, "The kind is actually non_behavior according to this prose.\n");
  } finally {
    await root.cleanup();
  }
});

test("rejects an artifact with no frontmatter block, naming the artifact path", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    const filePath = await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      "Just a prose document.\n",
    );

    await assert.rejects(
      () => readPhaseArtifact({ path: root.path }, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING);
        assert.equal(error.message, `Artifact has no YAML frontmatter block: ${filePath}`);
        assert.equal(error.details.artifactPath, filePath);
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});

test("rejects an artifact with unparsable YAML frontmatter, naming the artifact path", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    const filePath = await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      "---\nphaseId: [unclosed\n---\nBody.\n",
    );

    await assert.rejects(
      () => readPhaseArtifact({ path: root.path }, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_UNPARSABLE);
        assert.equal(error.message, `Artifact frontmatter is not valid YAML: ${filePath}`);
        assert.equal(error.details.artifactPath, filePath);
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});

test("rejects an artifact missing a required field, naming the artifact and field", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    const filePath = await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        acceptanceChecks: ["qa-p05-001"],
      }),
    );

    await assert.rejects(
      () => readPhaseArtifact({ path: root.path }, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_INVALID);
        assert.equal(
          error.message,
          `Artifact frontmatter field "sliceIds" is missing or has the wrong type: ${filePath}`,
        );
        assert.equal(error.details.artifactPath, filePath);
        assert.equal(error.details.field, "sliceIds");
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});

test("rejects an artifact carrying an unknown field, naming the artifact and field", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    const filePath = await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        sliceIds: ["slice-01"],
        acceptanceChecks: ["qa-p05-001"],
        unexpectedField: "surprise",
      }),
    );

    await assert.rejects(
      () => readPhaseArtifact({ path: root.path }, "phase-05"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_UNKNOWN);
        assert.equal(
          error.message,
          `Artifact frontmatter has an unknown field "unexpectedField": ${filePath}`,
        );
        assert.equal(error.details.artifactPath, filePath);
        assert.equal(error.details.field, "unexpectedField");
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});

test("rejects a slice whose phase directory does not exist on disk", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    const expectedLabel = path.join(
      root.path,
      ".workflow",
      "plans",
      "phases",
      "phase-99",
      "slice-01-*.md",
    );

    await assert.rejects(
      () => readSliceArtifact({ path: root.path }, "phase-99", "slice-01"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_NOT_FOUND);
        assert.equal(error.message, `Artifact does not exist: ${expectedLabel}`);
        assert.deepEqual(error.details, { artifactPath: expectedLabel });
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});

test("ignores an entry that shares the slice prefix but is not a markdown file", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    await writeArtifactFile(
      root.path,
      "phase-05",
      "slice-03-notes.txt",
      "Not a markdown artifact.\n",
    );
    await writeArtifactFile(
      root.path,
      "phase-05",
      "slice-03-frontmatter-artifact-reads.md",
      frontmatterDocument({
        sliceId: "slice-03",
        phaseId: "phase-05",
        kind: "behavior",
        filesInScope: ["src/artifacts/artifact-reader.ts"],
        unitVerificationCommand: "npm test",
        acceptanceChecks: ["qa-p05-010"],
      }),
    );

    const artifact = await readSliceArtifact({ path: root.path }, "phase-05", "slice-03");

    assert.equal(path.basename(artifact.path), "slice-03-frontmatter-artifact-reads.md");
  } finally {
    await root.cleanup();
  }
});

test("rejects a phase that does not exist on disk", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    const expectedPath = path.join(
      root.path,
      ".workflow",
      "plans",
      "phases",
      "phase-99",
      "phase.md",
    );

    await assert.rejects(
      () => readPhaseArtifact({ path: root.path }, "phase-99"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_NOT_FOUND);
        assert.equal(error.message, `Artifact does not exist: ${expectedPath}`);
        assert.deepEqual(error.details, { artifactPath: expectedPath });
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});

test("rejects a slice that does not exist on disk", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        sliceIds: ["slice-01"],
        acceptanceChecks: ["qa-p05-001"],
      }),
    );

    const expectedLabel = path.join(
      root.path,
      ".workflow",
      "plans",
      "phases",
      "phase-05",
      "slice-99-*.md",
    );

    await assert.rejects(
      () => readSliceArtifact({ path: root.path }, "phase-05", "slice-99"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_NOT_FOUND);
        assert.equal(error.message, `Artifact does not exist: ${expectedLabel}`);
        assert.deepEqual(error.details, { artifactPath: expectedLabel });
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});

test("resolves artifact paths identically for Windows-style and POSIX-style repository roots", async () => {
  const root = await createArtifactFixtureRoot();
  try {
    await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        sliceIds: ["slice-01"],
        acceptanceChecks: ["qa-p05-001"],
      }),
    );

    const posixRoot = root.path.replace(/\\/g, "/");
    const windowsStyleRoot = root.path.replace(/\//g, "\\");

    const posixResult = await readPhaseArtifact({ path: posixRoot }, "phase-05");
    const windowsResult = await readPhaseArtifact({ path: windowsStyleRoot }, "phase-05");

    assert.equal(posixResult.frontmatter.phaseId, "phase-05");
    assert.equal(windowsResult.frontmatter.phaseId, "phase-05");
    assert.equal(path.basename(posixResult.path), path.basename(windowsResult.path));
  } finally {
    await root.cleanup();
  }
});
