import { z } from "zod";

/**
 * Descriptive name for individual file status states.
 */
export type GitFileStatusDescription =
  | "unmodified"
  | "modified"
  | "added"
  | "deleted"
  | "renamed"
  | "copied"
  | "unmerged"
  | "untracked"
  | "ignored"
  | "type_changed"
  | "unknown";

/**
 * Structured status for a single file in the working tree and index.
 */
export interface GitFileStatus {
  /** Relative file path normalized with forward slashes. */
  path: string;
  /** Exact two-character porcelain status code (e.g. 'M ', ' M', '??', 'A '). */
  status_code: string;
  /** Parsed staging index status. */
  staged_status: GitFileStatusDescription;
  /** Parsed working tree status. */
  unstaged_status: GitFileStatusDescription;
  /** Original file path prior to rename or copy, if applicable. */
  orig_path?: string;
}

/**
 * Structured result returned by git_status.
 */
export interface GitStatusResult {
  /** True when there are no uncommitted staged or unstaged changes. */
  is_clean: boolean;
  /** Structured entries for each modified, untracked, or conflicted file. */
  entries: GitFileStatus[];
  /** Alias for entries. */
  files: GitFileStatus[];
}

/**
 * Input validation schema for git_status tool.
 */
export const GitStatusInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    untracked_files: z
      .enum(["all", "normal", "no"])
      .optional()
      .describe("Mode for handling untracked files: 'all', 'normal', or 'no'."),
    ignored: z
      .boolean()
      .optional()
      .describe("Whether to include ignored files in the status output."),
  })
  .strict();

export type GitStatusInput = z.infer<typeof GitStatusInputSchema>;

/**
 * Input validation schema for git_info tool.
 */
export const GitInfoInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
  })
  .strict();

export type GitInfoInput = z.infer<typeof GitInfoInputSchema>;

/**
 * Structured repository metadata returned by git_info.
 */
export interface GitInfoResult {
  /** Absolute path to the repository root directory with normalized forward slashes. */
  repo_root: string;
  /** Name of the currently active branch, or null if detached HEAD. */
  current_branch: string | null;
  /** 40-character SHA of the current HEAD commit, or null in an empty repository. */
  head_sha: string | null;
  /** True when the working tree and staging index have no uncommitted changes. */
  is_clean: boolean;
  /** Alias for is_clean. */
  clean: boolean;
  /** Remote origin URL if configured, otherwise null. */
  remote_url: string | null;
  /** Alias for remote_url. */
  remote_origin_url: string | null;
}
