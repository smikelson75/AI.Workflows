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

/**
 * Output modes supported by git_diff.
 */
export type GitDiffMode = "patch" | "stat" | "name_only" | "check";

/**
 * Input validation schema for git_diff tool.
 */
export const GitDiffInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    mode: z
      .enum(["patch", "stat", "name_only", "check"])
      .optional()
      .describe(
        "Diff output mode: 'patch' (full unified diff), 'stat' (file change summary and counts), 'name_only' (list of changed file paths), or 'check' (whitespace and conflict error detection). Defaults to 'patch'.",
      ),
    staged: z
      .boolean()
      .optional()
      .describe(
        "Whether to diff staged changes against HEAD (equivalent to git diff --cached/--staged). Defaults to false.",
      ),
    cached: z.boolean().optional().describe("Alias for staged."),
    target: z
      .string()
      .optional()
      .describe("Target commit, branch, or reference to compare against (e.g. 'HEAD~1', 'main')."),
    base: z
      .string()
      .optional()
      .describe(
        "Base commit, branch, or reference when comparing two references (e.g. base..target).",
      ),
    paths: z
      .array(z.string())
      .optional()
      .describe("Specific file or directory paths to filter the diff."),
    path: z.string().optional().describe("Convenience single file or directory path filter."),
    max_lines: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Maximum number of patch lines to return before truncating."),
  })
  .strict();

export type GitDiffInput = z.infer<typeof GitDiffInputSchema>;

/**
 * File change statistics in a diff.
 */
export interface GitDiffStatFile {
  /** Relative file path normalized with forward slashes. */
  path: string;
  /** Number of lines added. */
  insertions: number;
  /** Number of lines deleted. */
  deletions: number;
  /** True if the file was treated as binary by Git. */
  binary?: boolean;
}

/**
 * Summary of diff statistics.
 */
export interface GitDiffStatSummary {
  /** Number of files modified. */
  files_changed: number;
  /** Total number of line insertions across all modified files. */
  insertions: number;
  /** Total number of line deletions across all modified files. */
  deletions: number;
  /** Per-file modification statistics. */
  files: GitDiffStatFile[];
}

/**
 * Structured whitespace or conflict error item in check mode.
 */
export interface GitDiffCheckError {
  /** File path containing the issue. */
  file: string;
  /** Line number if reported by Git. */
  line?: number;
  /** Description of the check failure (e.g. trailing whitespace). */
  message: string;
}

/**
 * Check mode result for whitespace and conflict markers.
 */
export interface GitDiffCheckResult {
  /** True if whitespace or conflict errors were detected. */
  has_errors: boolean;
  /** Individual parsed check error items. */
  errors: GitDiffCheckError[];
  /** Raw check output lines from Git. */
  raw?: string;
}

/**
 * Structured result returned by git_diff tool.
 */
export interface GitDiffResult {
  /** Mode used for diff generation. */
  mode: GitDiffMode;
  /** Whether the diff was scoped to staged changes. */
  staged: boolean;
  /** True if there are no diff changes (or no check errors in check mode). */
  is_clean: boolean;
  /** Full unified diff text (populated in patch mode). */
  patch?: string;
  /** Diff stat counts and per-file modifications (populated in stat or patch mode). */
  stat?: GitDiffStatSummary;
  /** List of changed file paths (populated in name_only, stat, or patch mode). */
  files?: string[];
  /** Detailed check findings (populated in check mode). */
  check?: GitDiffCheckResult;
  /** True if output exceeded max_lines and was truncated. */
  is_truncated?: boolean;
}

/**
 * Input validation schema for git_log tool.
 */
export const GitLogInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    max_count: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Maximum number of commits to return (corresponds to git log -n / --max-count)."),
    limit: z.number().int().positive().optional().describe("Alias for max_count."),
    skip: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe(
        "Number of commits to skip before starting to show commit output (corresponds to git log --skip).",
      ),
    revision_range: z
      .string()
      .optional()
      .describe(
        "Commit or revision range to inspect (e.g. 'HEAD~5..HEAD', 'main', 'feature..main').",
      ),
    paths: z
      .array(z.string())
      .optional()
      .describe("Specific file or directory paths to filter commits."),
    path: z.string().optional().describe("Convenience single file or directory path filter."),
    author: z
      .string()
      .optional()
      .describe("Limit commits to those by a given author pattern (--author)."),
    since: z
      .string()
      .optional()
      .describe("Show commits more recent than a specific date/time (--since)."),
    until: z
      .string()
      .optional()
      .describe("Show commits older than a specific date/time (--until)."),
    oneline: z.boolean().optional().describe("Whether to produce compact log records."),
  })
  .strict();

export type GitLogInput = z.infer<typeof GitLogInputSchema>;

/**
 * Structured representation of a single Git commit record.
 */
export interface GitCommit {
  /** Full 40-character SHA of the commit. */
  hash: string;
  /** Abbreviated SHA of the commit. */
  short_hash: string;
  /** Author name and email formatted as 'Name <email>'. */
  author: string;
  /** Author name. */
  author_name?: string;
  /** Author email. */
  author_email?: string;
  /** Commit author date formatted as ISO 8601 string. */
  date: string;
  /** Commit subject line (first line of commit message). */
  subject: string;
  /** Commit body message (excluding subject line). */
  body: string;
  /** Relative file paths touched by this commit. */
  files_changed: string[];
}

/**
 * Structured result returned by git_log tool.
 */
export interface GitLogResult {
  /** List of parsed commit records in reverse chronological order. */
  commits: GitCommit[];
  /** Total count of commits returned. */
  total: number;
}
