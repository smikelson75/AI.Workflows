import type { GitExecutor } from "../../git/executor.js";
import type { GitInfoInput, GitInfoResult } from "../../models/inspection.js";

export const GIT_INFO_TOOL_DEFINITION = {
  name: "git_info",
  description:
    "Retrieves core repository metadata including absolute root directory path, current branch name, HEAD commit SHA, remote URL, and clean status indicator.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description: "Absolute path to the target Git repository.",
      },
    },
    required: ["repo_path"],
  },
};

/**
 * Executes repository metadata inspection commands and returns structured GitInfoResult.
 */
export async function executeGitInfo(
  executor: GitExecutor,
  input: GitInfoInput = {},
): Promise<GitInfoResult> {
  const repoRoot = await executor.getRepoRoot(input.repo_path);

  let currentBranch: string | null = null;
  try {
    const branchResult = await executor.exec(["branch", "--show-current"], {
      cwd: input.repo_path,
    });
    currentBranch = branchResult.stdout.trim() || null;
  } catch {
    currentBranch = null;
  }

  let headSha: string | null = null;
  try {
    const headResult = await executor.exec(["rev-parse", "HEAD"], {
      cwd: input.repo_path,
    });
    headSha = headResult.stdout.trim() || null;
  } catch {
    headSha = null;
  }

  let remoteUrl: string | null = null;
  try {
    const remoteResult = await executor.exec(["config", "--get", "remote.origin.url"], {
      cwd: input.repo_path,
    });
    remoteUrl = remoteResult.stdout.trim() || null;
  } catch {
    remoteUrl = null;
  }

  let isClean = true;
  try {
    const statusResult = await executor.exec(["status", "--porcelain=v1"], {
      cwd: input.repo_path,
    });
    isClean = statusResult.stdout.trim().length === 0;
  } catch {
    isClean = false;
  }

  return {
    repo_root: repoRoot,
    current_branch: currentBranch,
    head_sha: headSha,
    is_clean: isClean,
    clean: isClean,
    remote_url: remoteUrl,
    remote_origin_url: remoteUrl,
  };
}
