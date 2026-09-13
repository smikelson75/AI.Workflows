export interface GitErrorOptions {
  command: string[];
  exitCode?: number | null;
  stderr?: string;
  stdout?: string;
  timedOut?: boolean;
}

/**
 * Error thrown when a Git command execution fails.
 */
export class GitError extends Error {
  readonly exitCode: number | null;
  readonly stderr: string;
  readonly stdout: string;
  readonly command: string[];
  readonly timedOut: boolean;

  constructor(
    messageOrOptions: string | (GitErrorOptions & { message?: string }),
    maybeOptions?: GitErrorOptions,
  ) {
    const options =
      typeof messageOrOptions === "string" ? (maybeOptions ?? { command: [] }) : messageOrOptions;
    const message =
      typeof messageOrOptions === "string"
        ? messageOrOptions
        : (messageOrOptions.message ??
          `Git command failed with exit code ${String(options.exitCode ?? "unknown")}: git ${options.command.join(" ")}`);

    super(message);
    this.name = "GitError";
    this.command = options.command;
    this.exitCode = options.exitCode ?? null;
    this.stderr = options.stderr ?? "";
    this.stdout = options.stdout ?? "";
    this.timedOut = options.timedOut ?? false;
  }
}

export interface GitTimeoutErrorOptions {
  command: string[];
  timeoutMs: number;
  stderr?: string;
  stdout?: string;
}

/**
 * Error thrown when a Git command exceeds its execution timeout.
 */
export class GitTimeoutError extends GitError {
  readonly timeoutMs: number;

  constructor(
    messageOrOptions: string | GitTimeoutErrorOptions,
    maybeOptions?: GitTimeoutErrorOptions,
  ) {
    const options =
      typeof messageOrOptions === "string"
        ? (maybeOptions ?? { command: [], timeoutMs: 0 })
        : messageOrOptions;
    const message =
      typeof messageOrOptions === "string"
        ? messageOrOptions
        : `Git command timed out after ${String(options.timeoutMs)}ms: git ${options.command.join(" ")}`;

    super(message, {
      command: options.command,
      exitCode: null,
      stderr: options.stderr ?? "",
      stdout: options.stdout ?? "",
      timedOut: true,
    });
    this.name = "GitTimeoutError";
    this.timeoutMs = options.timeoutMs;
  }
}
