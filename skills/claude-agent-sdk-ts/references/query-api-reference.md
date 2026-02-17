# Query API Reference

> `@anthropic-ai/claude-agent-sdk@0.2.44`

## `query(options)` Function

The primary entry point. Returns a `Query` object that is an async iterable of `SDKMessage`.

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";
const q: Query = query({ prompt: string, options?: QueryOptions });
```

## QueryOptions — Complete Type

```ts
interface QueryOptions {
  // Model selection
  model?: "sonnet" | "opus" | "haiku";       // Default: "sonnet"

  // Prompts
  systemPrompt?: string;                      // Replaces default system prompt
  appendSystemPrompt?: string;                // Appended after default system prompt

  // Turn limits
  maxTurns?: number;                          // Default: Infinity

  // Permissions
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";
  canUseTool?: (toolName: string, toolInput: Record<string, unknown>) => ToolUseDecision;

  // Tools & MCP
  tools?: Tool[];                             // Custom tools via tool() helper
  mcpServers?: MCPServerConfig[];             // MCP server connections
  allowedTools?: string[];                    // Whitelist tool names
  disallowedTools?: string[];                 // Blacklist tool names

  // Subagents
  subagents?: AgentDefinition[];

  // Working directory
  cwd?: string;                               // Default: process.cwd()

  // Session management
  sessionId?: string;                         // Custom session ID (v0.2.33+)
  resume?: { sessionId: string; transcript: unknown[] };

  // Context
  contextWindow?: number;                     // Context window size in tokens
  maxCachePoints?: number;                    // Prompt caching breakpoints
  additionalDirectories?: string[];           // Extra CLAUDE.md dirs (v0.2.19+)

  // Debug
  debug?: boolean;                            // Enable debug logging (v0.2.30+)
  debugFile?: string;                         // Write debug to file (v0.2.30+)

  // File management
  enableFileCheckpointing?: boolean;          // Enable rewindFiles()

  // Output
  outputFormat?: {
    type: "json";
    schema: import("zod").ZodType;
  };

  // Sandbox
  sandbox?: SandboxSettings;

  // Beta
  betaFeatures?: string[];                    // e.g. ["context-1m-2025-08-07"]

  // Hooks
  hooks?: HookConfig;
}
```

## Query Object Methods

### `q.result: Promise<QueryResult>`

Available after the async iterator completes. Contains session metadata.

```ts
interface QueryResult {
  sessionId: string;       // Unique session identifier
  totalCost: number;       // Total cost in USD
  totalInput: number;      // Total input tokens
  totalOutput: number;     // Total output tokens
  duration: number;        // Total duration in milliseconds
  numTurns: number;        // Number of agentic turns
  stop_reason: string;     // "end_turn" | "max_turns" | "interrupt" | "error"
}
```

### `q.interrupt(): void`

Interrupts the current generation. The query will stop after the current tool completes.

### `q.rewindFiles(): void`

Reverts all file changes made during the query back to the pre-query state. Requires `enableFileCheckpointing: true`.

### `q.setPermissionMode(mode: PermissionMode): void`

Changes the permission mode mid-query.

### `q.setModel(model: string): void`

Changes the model mid-query.

### `q.close(): void` (v0.2.15+)

Closes the query and frees all resources. Always call this in a `finally` block if not using `for await`.

### `q.reconnectMcpServer(name: string): Promise<void>` (v0.2.21+)

Reconnects a disconnected MCP server by name.

### `q.toggleMcpServer(name: string, enabled: boolean): Promise<void>` (v0.2.21+)

Enables or disables an MCP server at runtime.

## SDKMessage Union Type

```ts
type SDKMessage =
  | { type: "assistant"; content: string }
  | { type: "tool_use"; toolName: string; toolInput: Record<string, unknown> }
  | { type: "tool_result"; toolName: string; content: string }
  | { type: "system"; content: string }
  | { type: "error"; error: string; code?: string }
  | { type: "result"; content: string; sessionId: string }
  | { type: "progress"; progress: number; total?: number };
```

### Message Type Details

| Type | When Emitted | Key Fields |
|------|-------------|------------|
| `assistant` | Claude generates text | `content` — streamed text chunk |
| `tool_use` | Claude calls a tool | `toolName`, `toolInput` |
| `tool_result` | Tool returns result | `toolName`, `content` |
| `system` | System-level info | `content` |
| `error` | Error occurred | `error`, `code` (optional) |
| `result` | Final structured output | `content` (JSON string), `sessionId` |
| `progress` | Progress update | `progress`, `total` (optional) |

## ToolUseDecision Type

```ts
type ToolUseDecision =
  | { allowed: true }
  | { allowed: false; reason: string }
  | undefined;  // Defer to permission mode
```

## `tool()` Helper

```ts
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const myTool = tool({
  name: string;                    // Tool name (unique)
  description: string;             // What the tool does
  inputSchema: z.ZodType;          // Zod schema for input
  execute: (input) => Promise<{ content: string }>;
  annotations?: {                  // Tool hints (v0.2.27+)
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
    idempotentHint?: boolean;
  };
});
```

## AgentDefinition Type

```ts
interface AgentDefinition {
  name: string;
  description: string;
  model?: "sonnet" | "opus" | "haiku";
  permissionMode?: PermissionMode;
  tools?: Tool[];
  mcpServers?: MCPServerConfig[];
  systemPrompt?: string;
  maxTurns?: number;
  allowedTools?: string[];
  disallowedTools?: string[];
}
```
