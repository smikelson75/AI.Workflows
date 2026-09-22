import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface FixtureRepo {
  /** Absolute path to the temporary repository. */
  path: string;
  /** Cleans up the temporary directory. */
  cleanup: () => Promise<void>;
}

/**
 * Creates an isolated temporary git repository with initialized git config.
 */
export async function createFixtureRepo(prefix = "verification-test-"): Promise<FixtureRepo> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));

  try {
    await execFileAsync("git", ["init", "--initial-branch=main"], {
      cwd: tmpDir,
    });
  } catch {
    // Fallback for git versions that do not support --initial-branch
    await execFileAsync("git", ["init"], { cwd: tmpDir });
  }

  await execFileAsync("git", ["config", "user.name", "Test User"], {
    cwd: tmpDir,
  });
  await execFileAsync("git", ["config", "user.email", "test@example.com"], {
    cwd: tmpDir,
  });

  return {
    path: tmpDir,
    cleanup: async () => {
      await fs.rm(tmpDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    },
  };
}
