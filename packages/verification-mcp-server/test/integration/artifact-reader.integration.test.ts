import assert from "node:assert/strict";
import { test } from "node:test";
import { readPhaseArtifact, readSliceArtifact } from "../../src/artifacts/artifact-reader.js";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";
import {
  createArtifactFixtureRoot,
  frontmatterDocument,
  writeArtifactFile,
} from "../helpers/artifact-fixture.js";

/**
 * Exercises readPhaseArtifact and readSliceArtifact against real files
 * written to a temporary directory on disk in one shared environment, to
 * prove the disk-read/YAML-parse serialization boundary works end-to-end.
 */
test("artifact reader integration: reads real phase and slice files from disk and fails closed on a defect", async () => {
  const root = await createArtifactFixtureRoot("verification-artifacts-integration-");
  try {
    // success: well-formed phase artifact read from disk
    await writeArtifactFile(
      root.path,
      "phase-05",
      "phase.md",
      frontmatterDocument({
        phaseId: "phase-05",
        sliceIds: ["slice-01", "slice-03"],
        acceptanceChecks: ["qa-p05-001"],
      }),
    );
    const phaseArtifact = await readPhaseArtifact({ path: root.path }, "phase-05");
    assert.equal(phaseArtifact.frontmatter.phaseId, "phase-05");
    assert.deepEqual(phaseArtifact.frontmatter.sliceIds, ["slice-01", "slice-03"]);

    // success: well-formed slice artifact read from disk
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
    const sliceArtifact = await readSliceArtifact({ path: root.path }, "phase-05", "slice-03");
    assert.equal(sliceArtifact.frontmatter.sliceId, "slice-03");
    assert.equal(sliceArtifact.frontmatter.kind, "behavior");

    // fail-closed: missing frontmatter block on disk
    await writeArtifactFile(root.path, "phase-06", "phase.md", "Just a prose document.\n");
    await assert.rejects(
      () => readPhaseArtifact({ path: root.path }, "phase-06"),
      (error: unknown) => {
        assert.ok(error instanceof VerificationError);
        assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING);
        return true;
      },
    );
  } finally {
    await root.cleanup();
  }
});
