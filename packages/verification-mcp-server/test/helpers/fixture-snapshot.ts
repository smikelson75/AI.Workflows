import fs from "node:fs/promises";
import path from "node:path";

/**
 * Recursively snapshots every file's content under rootPath (excluding .git)
 * so tests can assert a repository is byte-identical before and after a call.
 */
export async function snapshotTree(rootPath: string): Promise<Record<string, string>> {
  const snapshot: Record<string, string> = {};

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const relPath = path.relative(rootPath, fullPath).replace(/\\/g, "/");
        snapshot[relPath] = await fs.readFile(fullPath, "utf8");
      }
    }
  }

  await walk(rootPath);
  return snapshot;
}
