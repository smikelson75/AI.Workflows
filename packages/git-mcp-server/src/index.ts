#!/usr/bin/env node
import { realpathSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { GitMcpServer } from "./server.js";

export { GitExecutor } from "./git/executor.js";
export { GitError, GitTimeoutError } from "./git/errors.js";
export type { GitErrorOptions, GitTimeoutErrorOptions } from "./git/errors.js";
export type { GitExecOptions, GitExecResult } from "./git/types.js";
export { GitMcpServer, createGitMcpServer, SERVER_NAME, SERVER_VERSION } from "./server.js";
export type { GitMcpServerOptions } from "./server.js";

/**
 * Checks whether the module is being executed directly as a CLI script.
 */
function isDirectExecution(): boolean {
  if (!process.argv[1]) {
    return false;
  }
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const scriptPath = process.argv[1];
    if (currentFile === scriptPath) {
      return true;
    }
    return realpathSync(currentFile) === realpathSync(scriptPath);
  } catch {
    return false;
  }
}

/**
 * Main CLI entrypoint for running the MCP server over stdio.
 */
export async function main(): Promise<void> {
  const server = new GitMcpServer();

  let isClosing = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (isClosing) {
      return;
    }
    isClosing = true;
    try {
      await server.close();
    } catch (err) {
      console.error(`Error closing server on ${signal}:`, err);
      process.exit(1);
    }
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.stdin.on("close", () => {
    void shutdown("stdin close");
  });

  try {
    await server.startStdio();
  } catch (err) {
    console.error("Failed to start Git MCP server:", err);
    process.exit(1);
  }
}

if (isDirectExecution()) {
  void main();
}
