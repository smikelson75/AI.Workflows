import { z } from "zod";

/**
 * Input validation schema for git_branch tool.
 */
export const GitBranchInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    action: z.enum(["list", "create", "delete"]).describe("Branch operation to perform."),
    name: z.string().optional().describe("Branch name for 'create' or 'delete' actions."),
    force: z
      .boolean()
      .optional()
      .describe("When true with action 'delete', force-deletes an unmerged branch."),
  })
  .strict()
  .refine(
    (data) => data.action === "list" || (typeof data.name === "string" && data.name.length > 0),
    { message: "'name' is required for 'create' and 'delete' actions." },
  );

export type GitBranchInput = z.infer<typeof GitBranchInputSchema>;

/**
 * Structured entry describing a single local or remote branch.
 */
export interface GitBranchEntry {
  /** Branch name, without the refs/heads or refs/remotes prefix. */
  name: string;
  /** True when this branch is the currently checked out branch. */
  is_current: boolean;
  /** True when this entry is a remote-tracking branch. */
  is_remote: boolean;
}

/**
 * Structured result returned by git_branch with action 'list'.
 */
export interface GitBranchListResult {
  action: "list";
  /** Local and remote branch entries. */
  branches: GitBranchEntry[];
  /** Name of the currently checked out local branch, or null in detached HEAD. */
  current_branch: string | null;
}

/**
 * Structured result returned by git_branch with action 'create'.
 */
export interface GitBranchCreateResult {
  action: "create";
  /** Name of the branch that was created. */
  name: string;
}

/**
 * Structured result returned by git_branch with action 'delete'.
 */
export interface GitBranchDeleteResult {
  action: "delete";
  /** Name of the branch that was deleted. */
  name: string;
  /** True when the deletion was forced via -D. */
  forced: boolean;
}

export type GitBranchResult = GitBranchListResult | GitBranchCreateResult | GitBranchDeleteResult;
