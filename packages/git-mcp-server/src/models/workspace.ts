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

/**
 * Input validation schema for git_stash tool.
 */
export const GitStashInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    action: z.enum(["list", "push", "pop", "drop"]).describe("Stash operation to perform."),
    include_untracked: z
      .boolean()
      .optional()
      .describe("When true with action 'push', includes untracked files in the stash."),
    stash_index: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Stash index (0-based) for 'pop' and 'drop' actions. Defaults to 0."),
  })
  .strict();

export type GitStashInput = z.infer<typeof GitStashInputSchema>;

/**
 * Structured entry describing a single stash entry.
 */
export interface GitStashEntry {
  /** Zero-based index of the stash entry. */
  index: number;
  /** Branch name or commit hash where the stash was created. */
  branch: string;
  /** Descriptive message from the stash (e.g. "WIP on main: abc1234 commit message"). */
  message: string;
}

/**
 * Structured result returned by git_stash with action 'list'.
 */
export interface GitStashListResult {
  action: "list";
  /** Stash entries, ordered from newest to oldest. */
  entries: GitStashEntry[];
}

/**
 * Structured result returned by git_stash with action 'push'.
 */
export interface GitStashPushResult {
  action: "push";
  /** Created stash identifier (e.g. "stash@{0}"). */
  stash_id: string;
  /** Message describing the stash content. */
  message: string;
}

/**
 * Conflict information for a stash pop that did not apply cleanly.
 */
export interface GitStashConflict {
  /** Absolute path to the file with conflicts. */
  path: string;
  /** Conflict status (e.g. "both modified", "both added"). */
  status: string;
}

/**
 * Structured result returned by git_stash with action 'pop'.
 */
export interface GitStashPopResult {
  action: "pop";
  /** Index of the popped stash entry. */
  stash_index: number;
  /** True when the pop applied cleanly without conflicts. */
  success: boolean;
  /** Conflict diagnostics if success is false. */
  conflicts?: GitStashConflict[];
}

/**
 * Structured result returned by git_stash with action 'drop'.
 */
export interface GitStashDropResult {
  action: "drop";
  /** Index of the dropped stash entry. */
  stash_index: number;
}

export type GitStashResult =
  GitStashListResult | GitStashPushResult | GitStashPopResult | GitStashDropResult;
