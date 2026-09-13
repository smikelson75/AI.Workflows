/**
 * Git MCP Server entrypoint.
 */
export const SERVER_NAME = "git-mcp-server";
export const SERVER_VERSION = "0.1.0";

export { GitExecutor } from "./git/executor.js";
export { GitError, GitTimeoutError } from "./git/errors.js";
export type { GitErrorOptions, GitTimeoutErrorOptions } from "./git/errors.js";
export type { GitExecOptions, GitExecResult } from "./git/types.js";
