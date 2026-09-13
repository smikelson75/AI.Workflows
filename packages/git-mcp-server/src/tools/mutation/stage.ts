import path from "node:path";
import type { GitExecutor } from "../../git/executor.js";
import type { GitStageInput, GitStageResult } from "../../models/mutation.js";

export const GIT_STAGE_TOOL_DEFINITION = {
  name: "git_stage",
  description:
    "Stages explicit file paths into the index (git add -- <paths>), or stages all modified and untracked files when 'all: true' is provided.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description:
          "Path to the repository root or working directory. Defaults to the server default directory.",
      },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Explicit file or directory paths to stage.",
      },
      all: {
        type: "boolean",
        description: "When true, stages all modified and untracked files instead of using paths.",
      },
    },
  },
};

/**
 * Resolves a candidate path against the working directory and rejects it if it falls
 * outside the repository root, guarding against path traversal in mutating operations.
 */
export function resolvePathWithinRepo(repoRoot: string, cwd: string, inputPath: string): string {
  const absolute = path.resolve(cwd, inputPath);
  const normalized = absolute.replace(/\\/g, "/");
  const normalizedRoot = repoRoot.replace(/\\/g, "/");

  if (normalized !== normalizedRoot && !normalized.startsWith(`${normalizedRoot}/`)) {
    throw new Error(`Path '${inputPath}' resolves outside the repository root '${repoRoot}'.`);
  }

  return absolute;
}

/**
 * Executes git_stage: stages explicit paths or all modified/untracked files.
 */
export async function executeGitStage(
  executor: GitExecutor,
  input: GitStageInput,
): Promise<GitStageResult> {
  const cwd = input.repo_path ?? process.cwd();
  const repoRoot = await executor.getRepoRoot(input.repo_path);

  if (input.all === true) {
    await executor.exec(["add", "-A"], { cwd: input.repo_path });
    return { staged_paths: [], all: true };
  }

  const paths = input.paths ?? [];
  for (const inputPath of paths) {
    resolvePathWithinRepo(repoRoot, cwd, inputPath);
  }

  await executor.exec(["add", "--", ...paths], { cwd: input.repo_path });

  return { staged_paths: paths, all: false };
}
