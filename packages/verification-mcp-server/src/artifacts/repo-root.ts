import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";
import { ERROR_CODES } from "../errors/error-codes.js";
import { VerificationError } from "../errors/verification-error.js";
import type { RepoRoot } from "../models/repo-root.js";

const execFileAsync = promisify(execFile);

function normalizeSeparators(value: string): string {
  return value.replace(/\\/g, "/");
}

/**
 * Resolves and validates an explicit repo_path to its Git repository top level.
 * Never consults process.cwd(); invokes git via argument array, never a shell string.
 */
export async function resolveRepoRoot(repoPath: string | null | undefined): Promise<RepoRoot> {
  if (!repoPath || repoPath.trim().length === 0) {
    throw new VerificationError({
      code: ERROR_CODES.REPO_PATH_MISSING,
      message: "repo_path is required and must be a non-empty string",
      details: { repoPath: repoPath ?? null },
    });
  }

  let stats;
  try {
    stats = await fs.stat(repoPath);
  } catch {
    throw new VerificationError({
      code: ERROR_CODES.REPO_PATH_NOT_FOUND,
      message: `repo_path does not exist: ${repoPath}`,
      details: { repoPath },
    });
  }

  if (!stats.isDirectory()) {
    throw new VerificationError({
      code: ERROR_CODES.REPO_PATH_NOT_A_DIRECTORY,
      message: `repo_path is not a directory: ${repoPath}`,
      details: { repoPath },
    });
  }

  let stdout: string;
  try {
    const result = await execFileAsync("git", ["--no-pager", "rev-parse", "--show-toplevel"], {
      cwd: repoPath,
      shell: false,
      windowsHide: true,
    });
    stdout = result.stdout;
  } catch {
    throw new VerificationError({
      code: ERROR_CODES.REPO_PATH_NOT_A_GIT_REPOSITORY,
      message: `repo_path is not inside a Git repository: ${repoPath}`,
      details: { repoPath },
    });
  }

  return { path: normalizeSeparators(stdout.trim()) };
}
