import fs from "node:fs/promises";
import path from "node:path";
import { ERROR_CODES } from "../errors/error-codes.js";
import { VerificationError } from "../errors/verification-error.js";
import type { PhaseArtifact, SliceArtifact } from "../models/artifacts.js";
import type { RepoRoot } from "../models/repo-root.js";
import {
  PHASE_FRONTMATTER_SCHEMA,
  SLICE_FRONTMATTER_SCHEMA,
  validateFrontmatter,
} from "./frontmatter-schema.js";
import { parseFrontmatterYaml, splitFrontmatter } from "./frontmatter.js";

async function readArtifactFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    throw new VerificationError({
      code: ERROR_CODES.ARTIFACT_NOT_FOUND,
      message: `Artifact does not exist: ${filePath}`,
      details: { artifactPath: filePath },
    });
  }
}

function phaseDirPath(repoRoot: RepoRoot, phaseId: string): string {
  return path.join(repoRoot.path, ".workflow", "plans", "phases", phaseId);
}

/**
 * Reads and validates the frontmatter of a phase artifact at
 * `.workflow/plans/phases/<phaseId>/phase.md` relative to the resolved repository root.
 */
export async function readPhaseArtifact(
  repoRoot: RepoRoot,
  phaseId: string,
): Promise<PhaseArtifact> {
  const filePath = path.join(phaseDirPath(repoRoot, phaseId), "phase.md");
  const content = await readArtifactFile(filePath);
  const { frontmatterText, body } = splitFrontmatter(content, filePath);
  const raw = parseFrontmatterYaml(frontmatterText, filePath);
  const frontmatter = validateFrontmatter(PHASE_FRONTMATTER_SCHEMA, raw, filePath);
  return { path: filePath, frontmatter, body };
}

/**
 * Reads and validates the frontmatter of a slice artifact matching
 * `slice-NN-*.md` under the named phase, relative to the resolved repository root.
 */
export async function readSliceArtifact(
  repoRoot: RepoRoot,
  phaseId: string,
  sliceId: string,
): Promise<SliceArtifact> {
  const dirPath = phaseDirPath(repoRoot, phaseId);
  const artifactLabel = path.join(dirPath, `${sliceId}-*.md`);

  let entries: string[];
  try {
    entries = await fs.readdir(dirPath);
  } catch {
    throw new VerificationError({
      code: ERROR_CODES.ARTIFACT_NOT_FOUND,
      message: `Artifact does not exist: ${artifactLabel}`,
      details: { artifactPath: artifactLabel },
    });
  }

  const match = entries.find((entry) => entry.startsWith(`${sliceId}-`) && entry.endsWith(".md"));
  if (!match) {
    throw new VerificationError({
      code: ERROR_CODES.ARTIFACT_NOT_FOUND,
      message: `Artifact does not exist: ${artifactLabel}`,
      details: { artifactPath: artifactLabel },
    });
  }

  const filePath = path.join(dirPath, match);
  const content = await readArtifactFile(filePath);
  const { frontmatterText, body } = splitFrontmatter(content, filePath);
  const raw = parseFrontmatterYaml(frontmatterText, filePath);
  const frontmatter = validateFrontmatter(SLICE_FRONTMATTER_SCHEMA, raw, filePath);
  return { path: filePath, frontmatter, body };
}
