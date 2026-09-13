/**
 * Options for executing Git commands.
 */
export interface GitExecOptions {
  /** Working directory for the git command. Defaults to process cwd or executor default. */
  cwd?: string;
  /** Timeout in milliseconds before killing the command. Defaults to 15000 (15 seconds). */
  timeoutMs?: number;
  /** Additional environment variables to merge with process.env. */
  env?: Record<string, string>;
  /** Maximum buffer size in bytes for stdout and stderr. Defaults to 10MB. */
  maxBuffer?: number;
}

/**
 * Result of a Git command execution.
 */
export interface GitExecResult {
  /** Standard output from the git command. */
  stdout: string;
  /** Standard error output from the git command. */
  stderr: string;
  /** Process exit code. */
  exitCode: number;
}
