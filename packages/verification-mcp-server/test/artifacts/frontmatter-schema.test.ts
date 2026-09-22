import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PHASE_FRONTMATTER_SCHEMA,
  SLICE_FRONTMATTER_SCHEMA,
  validateFrontmatter,
} from "../../src/artifacts/frontmatter-schema.js";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";

test("returns validated data for well-formed phase frontmatter", () => {
  const raw = {
    phaseId: "phase-05",
    sliceIds: ["slice-01"],
    acceptanceChecks: ["qa-p05-001"],
  };

  const result = validateFrontmatter(PHASE_FRONTMATTER_SCHEMA, raw, "phase.md");

  assert.deepEqual(result, raw);
});

test("rejects frontmatter with a missing required field, naming the field and artifact", () => {
  const raw = { phaseId: "phase-05", acceptanceChecks: ["qa-p05-001"] };

  assert.throws(
    () => validateFrontmatter(PHASE_FRONTMATTER_SCHEMA, raw, "phase.md"),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_INVALID);
      assert.equal(
        error.message,
        'Artifact frontmatter field "sliceIds" is missing or has the wrong type: phase.md',
      );
      assert.deepEqual(error.details, { artifactPath: "phase.md", field: "sliceIds" });
      return true;
    },
  );
});

test("rejects frontmatter carrying an unknown field, naming the field and artifact", () => {
  const raw = {
    phaseId: "phase-05",
    sliceIds: ["slice-01"],
    acceptanceChecks: ["qa-p05-001"],
    unexpectedField: "surprise",
  };

  assert.throws(
    () => validateFrontmatter(PHASE_FRONTMATTER_SCHEMA, raw, "phase.md"),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_UNKNOWN);
      assert.equal(
        error.message,
        'Artifact frontmatter has an unknown field "unexpectedField": phase.md',
      );
      assert.deepEqual(error.details, { artifactPath: "phase.md", field: "unexpectedField" });
      return true;
    },
  );
});

test("reports the root when the root value itself has the wrong type", () => {
  assert.throws(
    () => validateFrontmatter(PHASE_FRONTMATTER_SCHEMA, null, "phase.md"),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_INVALID);
      assert.equal(
        error.message,
        'Artifact frontmatter field "(root)" is missing or has the wrong type: phase.md',
      );
      assert.deepEqual(error.details, { artifactPath: "phase.md", field: "(root)" });
      return true;
    },
  );
});

test("joins a nested field path with dots, distinguishing it from a concatenated path", () => {
  const raw = {
    phaseId: "phase-05",
    sliceIds: [123],
    acceptanceChecks: ["qa-p05-001"],
  };

  assert.throws(
    () => validateFrontmatter(PHASE_FRONTMATTER_SCHEMA, raw, "phase.md"),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.ARTIFACT_FIELD_INVALID);
      assert.equal(
        error.message,
        'Artifact frontmatter field "sliceIds.0" is missing or has the wrong type: phase.md',
      );
      assert.deepEqual(error.details, { artifactPath: "phase.md", field: "sliceIds.0" });
      return true;
    },
  );
});

test("validates well-formed slice frontmatter with an optional field omitted", () => {
  const raw = {
    sliceId: "slice-03",
    phaseId: "phase-05",
    kind: "behavior" as const,
    filesInScope: ["src/artifacts/artifact-reader.ts"],
    unitVerificationCommand: "npm test",
    acceptanceChecks: ["qa-p05-010"],
  };

  const result = validateFrontmatter(SLICE_FRONTMATTER_SCHEMA, raw, "slice.md");

  assert.deepEqual(result, raw);
});
