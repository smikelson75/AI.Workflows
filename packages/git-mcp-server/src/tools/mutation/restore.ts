import type { GitExecutor } from "../../git/executor.js";
import type { GitRestoreInput, GitRestoreResult } from "../../models/mutation.js";
import { resolvePathWithinRepo } from "./stage.js";

export const GIT_RESTORE_TOOL_DEFINITION = {
  name: "git_restore",
  description:
    "Discards working tree modifications for explicit file paths (git restore -- <paths>). Broad or wildcard-only path requests require 'confirm: true'.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description: "Absolute path to the target Git repository.",
      },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Explicit file or directory paths to restore in the working tree.",
      },
      confirm: {
        type: "boolean",
        description:
          "Must be true when any requested path is broad or wildcard-only, confirming intent to discard multiple files.",
      },
    },
    required: ["repo_path", "paths"],
  },
};

const BROAD_PATHS = new Set([".", "./", "/", "*", "**", "**/*"]);

/**
 * Determines whether a path is broad or wildcard-only, matching the whole working tree
 * rather than an explicit file, and therefore requires explicit confirmation to restore.
 */
export function isBroadOrWildcardPath(inputPath: string): boolean {
  return BROAD_PATHS.has(inputPath.trim()) || inputPath.includes("*");
}

/**
 * Executes git_restore: discards working tree modifications for explicit paths only.
 */
export async function executeGitRestore(
  executor: GitExecutor,
  input: GitRestoreInput,
): Promise<GitRestoreResult> {
  const cwd = input.repo_path ?? process.cwd();
  const repoRoot = await executor.getRepoRoot(input.repo_path);

  const hasBroadPath = input.paths.some(isBroadOrWildcardPath);
  if (hasBroadPath && input.confirm !== true) {
    throw new Error(
      "Broad or wildcard-only path requests require 'confirm: true' to discard working tree modifications.",
    );
  }

  for (const inputPath of input.paths) {
    resolvePathWithinRepo(repoRoot, cwd, inputPath);
  }

  await executor.exec(["restore", "--", ...input.paths], { cwd: input.repo_path });

  return { restored_paths: input.paths };
}
