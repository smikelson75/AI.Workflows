import { z } from "zod";

/**
 * Input validation schema for git_stage tool.
 */
export const GitStageInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    paths: z
      .array(z.string())
      .min(1)
      .optional()
      .describe("Explicit file or directory paths to stage."),
    all: z
      .boolean()
      .optional()
      .describe("When true, stages all modified and untracked files instead of using paths."),
  })
  .strict()
  .refine((data) => data.all === true || (data.paths !== undefined && data.paths.length > 0), {
    message: "Either 'all: true' or a non-empty 'paths' array must be provided.",
  });

export type GitStageInput = z.infer<typeof GitStageInputSchema>;

/**
 * Structured result returned by git_stage.
 */
export interface GitStageResult {
  /** Paths that were explicitly staged, normalized with forward slashes. Empty when all is true. */
  staged_paths: string[];
  /** True when all modified/untracked files were staged rather than an explicit path list. */
  all: boolean;
}

/**
 * Input validation schema for git_unstage tool.
 */
export const GitUnstageInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    paths: z
      .array(z.string())
      .min(1)
      .describe("Explicit file or directory paths to remove from the index."),
  })
  .strict();

export type GitUnstageInput = z.infer<typeof GitUnstageInputSchema>;

/**
 * Structured result returned by git_unstage.
 */
export interface GitUnstageResult {
  /** Paths removed from the index, normalized with forward slashes. */
  unstaged_paths: string[];
}

/**
 * Input validation schema for git_restore tool.
 */
export const GitRestoreInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    paths: z
      .array(z.string())
      .min(1)
      .describe("Explicit file or directory paths to restore in the working tree."),
    confirm: z
      .boolean()
      .optional()
      .describe(
        "Must be true when any requested path is broad or wildcard-only, confirming intent to discard multiple files.",
      ),
  })
  .strict();

export type GitRestoreInput = z.infer<typeof GitRestoreInputSchema>;

/**
 * Structured result returned by git_restore.
 */
export interface GitRestoreResult {
  /** Paths whose working tree contents were reverted to their last indexed state. */
  restored_paths: string[];
}

/**
 * Input validation schema for git_commit tool.
 */
export const GitCommitInputSchema = z
  .object({
    repo_path: z
      .string()
      .optional()
      .describe(
        "Path to the repository root or working directory. Defaults to the server default directory.",
      ),
    subject: z.string().min(1).describe("Conventional Commit subject line."),
    body: z.string().optional().describe("Optional commit message body."),
    footers: z
      .array(z.string().min(1))
      .optional()
      .describe("Optional commit message footer lines, e.g. 'Refs: #123'."),
    amend: z
      .boolean()
      .optional()
      .describe("When true, amends the previous commit instead of creating a new one."),
    allow_empty: z
      .boolean()
      .optional()
      .describe("When true, allows creating a commit with no staged changes."),
  })
  .strict();

export type GitCommitInput = z.infer<typeof GitCommitInputSchema>;

/**
 * Structured result returned by git_commit.
 */
export interface GitCommitResult {
  /** Full SHA of the resulting commit. */
  commit_sha: string;
  /** Conventional Commit subject used for the commit. */
  subject: string;
  /** True when the previous commit was amended rather than a new commit created. */
  amended: boolean;
}
