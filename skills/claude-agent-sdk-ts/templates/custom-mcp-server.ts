/**
 * In-process MCP server — zero network overhead
 * @anthropic-ai/claude-agent-sdk@0.2.50
 */
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Create an MCP server with custom tools
function createDatabaseServer() {
  const server = new McpServer({
    name: "database-tools",
    version: "1.0.0",
  });

  // In-memory store for demo
  const store = new Map<string, Record<string, unknown>>();

  server.tool(
    "db_get",
    "Get a record by key",
    { key: z.string() },
    async ({ key }) => ({
      content: [{ type: "text" as const, text: JSON.stringify(store.get(key) ?? null) }],
    }),
  );

  server.tool(
    "db_set",
    "Store a record with a key",
    { key: z.string(), value: z.string() },
    async ({ key, value }) => {
      store.set(key, JSON.parse(value));
      return { content: [{ type: "text" as const, text: `Stored key: ${key}` }] };
    },
  );

  server.tool(
    "db_list",
    "List all keys in the store",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify([...store.keys()]) }],
    }),
  );

  return server;
}

async function main() {
  const dbServer = createDatabaseServer();

  const q = query({
    prompt: "Store some user data and then retrieve it. Store 3 users with names and emails.",
    options: {
      model: "sonnet",
      maxTurns: 10,
      mcpServers: [
        {
          type: "sdk",
          server: dbServer,
          serverName: "database-tools",
        },
      ],
    },
  });

  for await (const message of q) {
    switch (message.type) {
      case "assistant":
        process.stdout.write(message.content);
        break;
      case "tool_use":
        console.log(`\n[MCP Tool: ${message.toolName}]`);
        break;
      case "tool_result":
        console.log(`  → ${message.content.slice(0, 100)}`);
        break;
    }
  }

  const result = await q.result;
  console.log(`\nDone. Cost: $${result.totalCost.toFixed(4)}`);
}

main().catch(console.error);
