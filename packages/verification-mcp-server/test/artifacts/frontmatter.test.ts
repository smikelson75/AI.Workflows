import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFrontmatterYaml, splitFrontmatter } from "../../src/artifacts/frontmatter.js";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";

test("splits a well-formed document into its exact frontmatter text and body", () => {
  const result = splitFrontmatter("---\nphaseId: phase-05\n---\nBody line.\n", "artifact.md");

  assert.equal(result.frontmatterText, "phaseId: phase-05");
  assert.equal(result.body, "Body line.\n");
});

test("trims surrounding whitespace before matching the opening and closing delimiters", () => {
  const result = splitFrontmatter(
    "  ---  \nphaseId: phase-05\n  ---  \nBody line.\n",
    "artifact.md",
  );

  assert.equal(result.frontmatterText, "phaseId: phase-05");
  assert.equal(result.body, "Body line.\n");
});

test("rejects a document that does not open with a frontmatter delimiter", () => {
  assert.throws(
    () => splitFrontmatter("Just a prose document.\n", "artifact.md"),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING);
      assert.equal(error.message, "Artifact has no YAML frontmatter block: artifact.md");
      assert.deepEqual(error.details, { artifactPath: "artifact.md" });
      return true;
    },
  );
});

test("rejects a document whose frontmatter block is never closed", () => {
  assert.throws(
    () => splitFrontmatter("---\nphaseId: phase-05\nBody line.\n", "artifact.md"),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING);
      assert.equal(error.message, "Artifact frontmatter block is not closed: artifact.md");
      assert.deepEqual(error.details, { artifactPath: "artifact.md" });
      return true;
    },
  );
});

test("parses valid YAML frontmatter into raw data", () => {
  const raw = parseFrontmatterYaml("phaseId: phase-05\nsliceIds:\n  - slice-01", "artifact.md");

  assert.deepEqual(raw, { phaseId: "phase-05", sliceIds: ["slice-01"] });
});

test("rejects unparsable YAML frontmatter, naming the artifact path", () => {
  assert.throws(
    () => parseFrontmatterYaml("phaseId: [unclosed", "artifact.md"),
    (error: unknown) => {
      assert.ok(error instanceof VerificationError);
      assert.equal(error.code, ERROR_CODES.ARTIFACT_FRONTMATTER_UNPARSABLE);
      assert.equal(error.message, "Artifact frontmatter is not valid YAML: artifact.md");
      assert.deepEqual(error.details, { artifactPath: "artifact.md" });
      return true;
    },
  );
});
