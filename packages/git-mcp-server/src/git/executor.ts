import { execFile } from "node:child_process";
import { GitError, GitTimeoutError } from "./errors.js";
import type { GitExecOptions, GitExecResult } from "./types.js";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_BUFFER = 10 * 1024 * 1024; // 10MB

/**
 * Executes Git CLI commands safely using child_process.execFile without spawning a shell.
 */
export class GitExecutor {
  constructor(private readonly defaultOptions?: GitExecOptions) {}

  /**
   * Executes a git command with the provided argument array.
   */
  async exec(args: string[], options?: GitExecOptions): Promise<GitExecResult> {
    const cwd = options?.cwd ?? this.defaultOptions?.cwd;
    const timeoutMs = options?.timeoutMs ?? this.defaultOptions?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxBuffer = options?.maxBuffer ?? this.defaultOptions?.maxBuffer ?? DEFAULT_MAX_BUFFER;

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_PAGER: "cat",
      ...this.defaultOptions?.env,
      ...options?.env,
    };

    const fullArgs = args.includes("--no-pager") ? [...args] : ["--no-pager", ...args];

    return new Promise<GitExecResult>((resolve, reject) => {
      let timedOut = false;
      let timer: NodeJS.Timeout | undefined;

      if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
        timer = setTimeout(() => {
          timedOut = true;
        }, timeoutMs);
        timer.unref();
      }

      execFile(
        "git",
        fullArgs,
        {
          cwd,
          timeout: timeoutMs,
          env,
          shell: false,
          maxBuffer,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (timer) {
            clearTimeout(timer);
          }

          const stdoutStr = stdout;
          const stderrStr = stderr;

          if (error) {
            const isTimeout =
              timedOut ||
              Boolean(error.killed && timeoutMs > 0) ||
              error.code === "ETIMEDOUT" ||
              (error.signal === "SIGTERM" && timeoutMs > 0);

            if (isTimeout) {
              reject(
                new GitTimeoutError({
                  command: args,
                  timeoutMs,
                  stdout: stdoutStr,
                  stderr: stderrStr,
                }),
              );
              return;
            }

            const exitCode = typeof error.code === "number" ? error.code : null;
            reject(
              new GitError({
                message:
                  `Git command failed with exit code ${String(exitCode ?? "unknown")}: git ${args.join(" ")}\n${stderrStr}`.trimEnd(),
                command: args,
                exitCode,
                stdout: stdoutStr,
                stderr: stderrStr,
                timedOut: false,
              }),
            );
            return;
          }

          resolve({
            stdout: stdoutStr,
            stderr: stderrStr,
            exitCode: 0,
          });
        },
      );
    });
  }

  /**
   * Discovers the repository root directory for the given or default cwd.
   * Path separators are normalized to forward slashes.
   */
  async getRepoRoot(cwd?: string): Promise<string> {
    const targetCwd = cwd ?? this.defaultOptions?.cwd;
    const result = await this.exec(["rev-parse", "--show-toplevel"], {
      cwd: targetCwd,
    });
    return result.stdout.trim().replace(/\\/g, "/");
  }

  /**
   * Retrieves the installed Git version string.
   */
  async getVersion(): Promise<string> {
    const result = await this.exec(["--version"]);
    return result.stdout.trim();
  }
}
