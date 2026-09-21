# Git MCP Server Setup

This repository includes a standalone Git Model Context Protocol (MCP) server in `packages/git-mcp-server`.

## What it does

The server exposes safe, structured Git operations over stdio for MCP clients. It is designed to avoid shell interpolation risks and return parsed results instead of raw shell output.

Key package details:

- Package: `packages/git-mcp-server`
- Runtime: Node.js >= 22.12.0
- Entry point: `dist/index.js`
- Bin name: `git-mcp-server`
- Transport: stdio MCP server

## Prerequisites

Before starting the server, make sure you have:

- Node.js 22.12.0 or later
- Git installed and available on your `PATH`
- A working MCP client or editor that can launch a stdio process

## Install dependencies

From the repository root:

```bash
npm install
cd packages/git-mcp-server
npm install
```

## Build the server

From `packages/git-mcp-server`:

```bash
npm run build
```

Optional validation checks:

```bash
npm run typecheck
npm run verify
```

## Run the server locally

### Production-style run

```bash
cd packages/git-mcp-server
node dist/index.js
```

This starts the Git MCP server over stdio and waits for MCP protocol messages.

### Development run

```bash
cd packages/git-mcp-server
npx tsx src/index.ts
```

## MCP client configuration

A typical MCP config entry can look like this:

```json
{
  "mcpServers": {
    "git-mcp-server": {
      "command": "node",
      "args": [
        "C:/Projects/AI.Workflows/packages/git-mcp-server/dist/index.js"
      ]
    }
  }
}
```

If you are using the package globally or have installed it through the bin entry, this can also be simplified to:

```json
{
  "mcpServers": {
    "git-mcp-server": {
      "command": "git-mcp-server"
    }
  }
}
```

## Available Git operations

Every MCP tool call must include `repo_path` as an absolute path to the target repository. The server rejects omitted or relative paths because an MCP client may launch it from an unrelated working directory.

Example:

```json
{
  "repo_path": "C:/Projects/Scheduler"
}
```

The server provides structured Git tooling for:

- inspection (status, diff, log, info)
- mutation (stage, unstage, restore, commit)
- branch and stash operations
- workspace and end-to-end verification flows

## Troubleshooting

### `node` version too old

Use Node 22.12+ and verify:

```bash
node -v
```

### Git command not found

Check that Git is installed and available:

```bash
git --version
```

### Server starts but client cannot connect

Confirm that:

- the process is launched with `stdio` transport
- the command path is correct
- the config points to the built `dist/index.js` file

## Project paths

Relevant files:

- `packages/git-mcp-server/package.json`
- `packages/git-mcp-server/src/index.ts`
- `packages/git-mcp-server/src/server.ts`
- `packages/git-mcp-server/src/git/executor.ts`

## Quick verification

From the package directory:

```bash
npm test
```

This exercises the bundled Node test suite for the Git MCP server.
