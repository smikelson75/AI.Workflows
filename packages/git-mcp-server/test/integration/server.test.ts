import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createGitMcpServer, GitMcpServer, SERVER_NAME, SERVER_VERSION } from "../../src/index.js";

describe("GitMcpServer Integration & E2E", () => {
  let serverInstance: GitMcpServer;
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  before(async () => {
    serverInstance = createGitMcpServer();
    client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([serverInstance.connect(serverTransport), client.connect(clientTransport)]);
  });

  after(async () => {
    await client.close();
    await serverInstance.close();
  });

  describe("MCP Handshake & Protocol Lifecycle", () => {
    // @qa-p01-005: MCP server initialization handshake over stdio
    it("completes MCP initialize handshake and exchanges identity and capabilities", () => {
      const serverVersion = client.getServerVersion();
      assert.ok(serverVersion, "Server version object should be returned");
      assert.equal(serverVersion.name, SERVER_NAME);
      assert.equal(serverVersion.version, SERVER_VERSION);

      const serverCapabilities = client.getServerCapabilities();
      assert.ok(serverCapabilities, "Server capabilities should be returned");
      assert.ok(typeof serverCapabilities === "object");
    });

    it("responds to client ping successfully", async () => {
      await client.ping();
      assert.ok(true, "Ping completed without error");
    });

    it("provides access to underlying GitExecutor", () => {
      const executor = serverInstance.getExecutor();
      assert.ok(executor, "Server instance must expose GitExecutor");
    });
  });
});
