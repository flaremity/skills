# MCP Servers Guide

> `@anthropic-ai/claude-agent-sdk@0.2.56`

## Overview

MCP (Model Context Protocol) servers provide tools to Claude. The SDK supports 4 transport types.

## Transport Types

### 1. stdio — Subprocess

Spawns a child process that communicates via stdin/stdout.

```ts
{
  type: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
  env: { CUSTOM_VAR: "value" },  // Optional environment variables
}
```

**Use when:** Running local MCP servers, development, access to local filesystem.

**Caveats:**
- Process must stay alive for the duration of the query
- On exit, child processes may hang — use `q.close()` to clean up
- Environment variables are inherited from parent + merged with `env`

### 2. sse — Server-Sent Events (Legacy)

Connects to a remote server using SSE for server→client streaming.

```ts
{
  type: "sse",
  url: "http://localhost:3001/sse",
  headers: { Authorization: "Bearer token" },
}
```

**Use when:** Connecting to legacy MCP servers that only support SSE.

**Note:** SSE is being replaced by Streamable HTTP. Prefer `http` type for new servers.

### 3. http — Streamable HTTP (Recommended)

Connects to a remote server using HTTP with streaming responses.

```ts
{
  type: "http",
  url: "https://mcp.example.com/mcp",
  headers: {
    Authorization: "Bearer token",
    "X-Custom-Header": "value",
  },
}
```

**Use when:** Connecting to remote/production MCP servers, Cloudflare Workers.

### 4. sdk — In-Process (Zero Overhead)

Runs an MCP server in the same process. No network, no serialization overhead.

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "my-tools", version: "1.0.0" });
// Register tools on server...

{
  type: "sdk",
  server: server,          // McpServer instance
  serverName: "my-tools",  // Unique name
}
```

**Use when:** Custom tools that don't need to be separate processes, testing, maximum performance.

## Tool Naming Convention

MCP tools are exposed to Claude with double-underscore naming:

```
mcp__{serverName}__{toolName}
```

Example: An MCP server named `"github"` with tool `"list_repos"` becomes `mcp__github__list_repos`.

## Tool Annotations (v0.2.27+)

Tool annotations provide hints to Claude about tool behavior:

```ts
server.tool(
  "read_file",
  { path: z.string() },
  async ({ path }) => { /* ... */ },
  {
    annotations: {
      readOnlyHint: true,       // Does not modify state
      destructiveHint: false,    // Does not destroy data
      openWorldHint: false,      // Operates on closed set
      idempotentHint: true,      // Same input = same result
    },
  },
);
```

| Annotation | Default | Effect |
|-----------|---------|--------|
| `readOnlyHint` | `false` | Tool doesn't modify state |
| `destructiveHint` | `true` | Tool may destroy data |
| `openWorldHint` | `true` | Tool accesses external systems |
| `idempotentHint` | `false` | Repeated calls are safe |

## Runtime Management (v0.2.21+)

```ts
// Reconnect a failed server
await q.reconnectMcpServer("my-tools");

// Disable a server temporarily
await q.toggleMcpServer("my-tools", false);

// Re-enable
await q.toggleMcpServer("my-tools", true);
```

## Multiple Servers

```ts
const q = query({
  prompt: "Use GitHub and Jira to sync issues",
  options: {
    mcpServers: [
      { type: "stdio", command: "github-mcp", args: [] },
      { type: "http", url: "https://jira-mcp.example.com/mcp", headers: {} },
      { type: "sdk", server: customServer, serverName: "custom" },
    ],
  },
});
```

All servers' tools are available simultaneously. Use `allowedTools` or `disallowedTools` to restrict.

## Best Practices

1. **Prefer `sdk` type** for custom tools — zero overhead, easier debugging
2. **Use `http` type** for production remote servers
3. **Always set `serverName`** — it's used in tool naming and management
4. **Clean up with `q.close()`** — especially for `stdio` servers
5. **Set timeouts** on MCP tool implementations to prevent hanging
6. **Use tool annotations** to help Claude make better decisions
