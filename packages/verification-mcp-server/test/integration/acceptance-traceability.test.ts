import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const testRoot = path.resolve(dirname, "..");
const featurePath = path.resolve(
  dirname,
  "../../../../.workflow/plans/phases/phase-05/acceptance.feature",
);

interface ScenarioTag {
  id: string;
  tier: "unit" | "integration" | "e2e";
}

/** One approved exception per scenario ID that cannot map to a source-level test. */
const APPROVED_EXCEPTIONS: Record<string, string> = {
  "qa-p05-001": "verified by the static verification command (npm run verify), not a test",
};

/**
 * Maps every non-excepted @unit/@integration/@e2e scenario ID to the test file
 * and test title that covers it, so coverage is asserted by reading real
 * source text rather than by inspection.
 */
const SCENARIO_TESTS: Record<string, { file: string; title: string }> = {
  "qa-p05-002": {
    file: "artifacts/repo-root.test.ts",
    title: "resolves a nested subdirectory to the same repository top level",
  },
  "qa-p05-003": {
    file: "integration/repo-root.integration.test.ts",
    title: "resolution does not depend on the caller's current directory",
  },
  "qa-p05-004": {
    file: "artifacts/repo-root.test.ts",
    title: "rejects an absent repo_path without resolving",
  },
  "qa-p05-005": {
    file: "artifacts/repo-root.test.ts",
    title: "rejects a non-existent path",
  },
  "qa-p05-006": {
    file: "artifacts/repo-root.test.ts",
    title: "rejects a path that is a file rather than a directory",
  },
  "qa-p05-007": {
    file: "artifacts/repo-root.test.ts",
    title: "rejects a directory outside any git repository",
  },
  "qa-p05-008": {
    file: "integration/repo-root.integration.test.ts",
    title: "reports the same normalized root for Windows-style and POSIX-style input",
  },
  "qa-p05-009": {
    file: "errors/error-codes.test.ts",
    title: "error code registry has no duplicate identifiers",
  },
  "qa-p05-010": {
    file: "artifacts/artifact-reader.test.ts",
    title: "reads a well-formed phase artifact and returns its declared fields",
  },
  "qa-p05-011": {
    file: "artifacts/artifact-reader.test.ts",
    title: "reads a well-formed slice artifact and returns its declared fields",
  },
  "qa-p05-012": {
    file: "artifacts/artifact-reader.test.ts",
    title: "returns the document body unchanged, never derived from frontmatter",
  },
  "qa-p05-013": {
    file: "artifacts/artifact-reader.test.ts",
    title: "rejects an artifact with no frontmatter block, naming the artifact path",
  },
  "qa-p05-014": {
    file: "artifacts/artifact-reader.test.ts",
    title: "rejects an artifact with unparsable YAML frontmatter, naming the artifact path",
  },
  "qa-p05-015": {
    file: "artifacts/artifact-reader.test.ts",
    title: "rejects an artifact missing a required field, naming the artifact and field",
  },
  "qa-p05-016": {
    file: "artifacts/artifact-reader.test.ts",
    title: "rejects an artifact carrying an unknown field, naming the artifact and field",
  },
  "qa-p05-017": {
    file: "artifacts/artifact-reader.test.ts",
    title: "rejects a phase that does not exist on disk",
  },
  "qa-p05-018": {
    file: "e2e/artifact-layer.e2e.test.ts",
    title: "e2e: reads a complete phase and all of its slices from a realistic repository",
  },
  "qa-p05-019": {
    file: "e2e/artifact-layer.e2e.test.ts",
    title: "e2e: rejects an artifact without frontmatter and leaves the repository unchanged",
  },
  "qa-p05-020": {
    file: "e2e/artifact-layer.e2e.test.ts",
    title:
      "e2e: remains usable after a rejected request, returning the well-formed artifact afterward",
  },
};

function parseScenarioTags(featureText: string): ScenarioTag[] {
  const tags: ScenarioTag[] = [];
  const pattern = /@(qa-p05-\d+)\s+@(unit|integration|e2e)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(featureText)) !== null) {
    tags.push({ id: match[1], tier: match[2] as ScenarioTag["tier"] });
  }
  return tags;
}

/**
 * Reads the phase-05 acceptance feature, or returns null when the repo root
 * (outside the package directory) is not present, as in a mutation-testing sandbox.
 */
async function readFeatureTextOrNull(): Promise<string | null> {
  try {
    return await fs.readFile(featurePath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

test("traceability: every non-excepted @unit/@integration/@e2e scenario maps to an executable test", async (t) => {
  const featureText = await readFeatureTextOrNull();
  if (featureText === null) {
    t.skip("acceptance.feature is outside this sandbox (e.g. a mutation-testing sandbox)");
    return;
  }
  const scenarios = parseScenarioTags(featureText);
  assert.ok(scenarios.length > 0, "expected at least one tagged scenario in acceptance.feature");

  for (const scenario of scenarios) {
    if (scenario.id in APPROVED_EXCEPTIONS) {
      continue;
    }

    const mapping = SCENARIO_TESTS[scenario.id];
    assert.ok(mapping, `scenario ${scenario.id} (@${scenario.tier}) has no mapped test`);

    const filePath = path.join(testRoot, mapping.file);
    const fileContent = await fs.readFile(filePath, "utf8");
    assert.ok(
      fileContent.includes(mapping.title),
      `scenario ${scenario.id}: expected ${mapping.file} to contain a test titled "${mapping.title}"`,
    );
  }
});

test("traceability: the approved exception registry only names scenarios present in the feature", async (t) => {
  const featureText = await readFeatureTextOrNull();
  if (featureText === null) {
    t.skip("acceptance.feature is outside this sandbox (e.g. a mutation-testing sandbox)");
    return;
  }
  const scenarioIds = new Set(parseScenarioTags(featureText).map((scenario) => scenario.id));

  for (const exceptionId of Object.keys(APPROVED_EXCEPTIONS)) {
    assert.ok(
      scenarioIds.has(exceptionId),
      `approved exception ${exceptionId} does not match any scenario in acceptance.feature`,
    );
  }
});
