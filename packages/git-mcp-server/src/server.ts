/* eslint-disable @typescript-eslint/no-deprecated */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { GitExecutor } from "./git/executor.js";

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
