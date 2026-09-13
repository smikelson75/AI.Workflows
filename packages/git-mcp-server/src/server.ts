/* eslint-disable @typescript-eslint/no-deprecated */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { GitExecutor } from "./git/executor.js";
import {
  GitDiffInputSchema,
  GitInfoInputSchema,
  GitLogInputSchema,
  GitStatusInputSchema,
} from "./models/inspection.js";
import {
  GitCommitInputSchema,
  GitRestoreInputSchema,
  GitStageInputSchema,
  GitUnstageInputSchema,
} from "./models/mutation.js";
import { executeGitDiff, GIT_DIFF_TOOL_DEFINITION } from "./tools/inspection/diff.js";
import { executeGitInfo, GIT_INFO_TOOL_DEFINITION } from "./tools/inspection/info.js";
import { executeGitLog, GIT_LOG_TOOL_DEFINITION } from "./tools/inspection/log.js";
import { executeGitStatus, GIT_STATUS_TOOL_DEFINITION } from "./tools/inspection/status.js";
import { executeGitCommit, GIT_COMMIT_TOOL_DEFINITION } from "./tools/mutation/commit.js";
import { executeGitRestore, GIT_RESTORE_TOOL_DEFINITION } from "./tools/mutation/restore.js";
import { executeGitStage, GIT_STAGE_TOOL_DEFINITION } from "./tools/mutation/stage.js";
import { executeGitUnstage, GIT_UNSTAGE_TOOL_DEFINITION } from "./tools/mutation/unstage.js";

export const SERVER_NAME = "git-mcp-server";
export const SERVER_VERSION = "0.1.0";

export interface GitMcpServerOptions {
  name?: string;
  version?: string;
  executor?: GitExecutor;
}

export class GitMcpServer {
  private readonly server: Server;
  private readonly executor: GitExecutor;

  constructor(options: GitMcpServerOptions = {}) {
    const name = options.name ?? SERVER_NAME;
    const version = options.version ?? SERVER_VERSION;
    this.executor = options.executor ?? new GitExecutor();
    this.server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
    this.registerTools();
  }

  private registerTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: [
          GIT_STATUS_TOOL_DEFINITION,
          GIT_INFO_TOOL_DEFINITION,
          GIT_DIFF_TOOL_DEFINITION,
          GIT_LOG_TOOL_DEFINITION,
          GIT_STAGE_TOOL_DEFINITION,
          GIT_UNSTAGE_TOOL_DEFINITION,
          GIT_RESTORE_TOOL_DEFINITION,
          GIT_COMMIT_TOOL_DEFINITION,
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      switch (name) {
        case "git_status": {
          const parseResult = GitStatusInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_status: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitStatus(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        case "git_info": {
          const parseResult = GitInfoInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_info: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitInfo(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        case "git_diff": {
          const parseResult = GitDiffInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_diff: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitDiff(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        case "git_log": {
          const parseResult = GitLogInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_log: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitLog(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        case "git_stage": {
          const parseResult = GitStageInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_stage: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitStage(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        case "git_unstage": {
          const parseResult = GitUnstageInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_unstage: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitUnstage(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        case "git_restore": {
          const parseResult = GitRestoreInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_restore: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitRestore(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        case "git_commit": {
          const parseResult = GitCommitInputSchema.safeParse(args ?? {});
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for git_commit: ${parseResult.error.message}`,
            );
          }
          try {
            const result = await executeGitCommit(this.executor, parseResult.data);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result as unknown as Record<string, unknown>,
            };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            };
          }
        }
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });
  }

  public getServer(): Server {
    return this.server;
  }

  public getExecutor(): GitExecutor {
    return this.executor;
  }

  public async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  public async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.connect(transport);
  }

  public async close(): Promise<void> {
    await this.server.close();
  }
}

export function createGitMcpServer(options?: GitMcpServerOptions): GitMcpServer {
  return new GitMcpServer(options);
}
