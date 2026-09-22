import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";

export interface ArtifactFixtureRoot {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates an isolated temporary directory to act as a resolved Repository Root
 * for artifact-layer tests. No git repository is required for these reads.
 */
export async function createArtifactFixtureRoot(
  prefix = "verification-artifacts-",
): Promise<ArtifactFixtureRoot> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  return {
    path: tmpDir,
    cleanup: async () => {
      await fs.rm(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    },
  };
}

export function frontmatterDocument(
  fields: Record<string, unknown>,
  body = "Prose body.\n",
): string {
  return `---\n${yaml.dump(fields)}---\n${body}`;
}

/**
 * Writes a phase or slice artifact file under
 * `.workflow/plans/phases/<phaseId>/<fileName>` beneath the given root.
 */
export async function writeArtifactFile(
  rootPath: string,
  phaseId: string,
  fileName: string,
  content: string,
): Promise<string> {
  const dirPath = path.join(rootPath, ".workflow", "plans", "phases", phaseId);
  await fs.mkdir(dirPath, { recursive: true });
  const filePath = path.join(dirPath, fileName);
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}
