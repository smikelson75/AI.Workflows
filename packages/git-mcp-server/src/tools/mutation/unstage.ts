import type { GitExecutor } from "../../git/executor.js";
import type { GitUnstageInput, GitUnstageResult } from "../../models/mutation.js";
import { resolvePathWithinRepo } from "./stage.js";

export const GIT_UNSTAGE_TOOL_DEFINITION = {
  name: "git_unstage",
  description:
    "Removes explicit file paths from the index (git restore --staged -- <paths>) without discarding working tree modifications.",
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
        description: "Explicit file or directory paths to remove from the index.",
      },
    },
    required: ["paths"],
  },
};

/**
 * Executes git_unstage: removes explicit paths from the index without touching the working tree.
 */
export async function executeGitUnstage(
  executor: GitExecutor,
  input: GitUnstageInput,
): Promise<GitUnstageResult> {
  const cwd = input.repo_path ?? process.cwd();
  const repoRoot = await executor.getRepoRoot(input.repo_path);

  for (const inputPath of input.paths) {
    resolvePathWithinRepo(repoRoot, cwd, inputPath);
  }

  await executor.exec(["restore", "--staged", "--", ...input.paths], { cwd: input.repo_path });

  return { unstaged_paths: input.paths };
}
