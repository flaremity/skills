# Query API Reference

> `@anthropic-ai/claude-agent-sdk@0.2.76`

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
  model?: string;                              // Model alias or full model ID. Default: "sonnet"

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

  // Thinking (v0.2.50+)
  thinking?: ThinkingConfig;                      // { type: 'adaptive' } | { type: 'enabled', budgetTokens?: number } | { type: 'disabled' }

  // Prompt suggestions (v0.2.50+)
  promptSuggestions?: boolean;                    // Enable prompt suggestions after each turn

  // Hooks
  hooks?: HookConfig;

  // MCP Elicitation (v0.2.63+)
  onElicitation?: OnElicitation;              // Callback for MCP elicitation requests

  // Per-tool configuration (v0.2.70+)
  toolConfig?: ToolConfig;                    // e.g. { askUserQuestion: { previewFormat: 'html' } }

  // Settings override (v0.2.70+)
  settings?: string | Settings;              // Path to settings JSON or inline settings object (highest priority)

  // Agent progress summaries (v0.2.76+)
  agentProgressSummaries?: boolean;           // Enable periodic AI-generated progress summaries for subagents
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

### `q.supportedAgents(): Promise<AgentInfo[]>` (v0.2.63+)

Returns the list of available subagents for the current session.

```ts
interface AgentInfo {
  name: string;          // Agent type identifier (e.g., "Explore")
  description: string;   // When to use this agent
  model?: string;        // Model alias (inherits parent if omitted)
}
```

### `q.reconnectMcpServer(name: string): Promise<void>` (v0.2.21+)

Reconnects a disconnected MCP server by name.

### `q.toggleMcpServer(name: string, enabled: boolean): Promise<void>` (v0.2.21+)

Enables or disables an MCP server at runtime.

## ThinkingConfig Type (v0.2.50+)

```ts
type ThinkingConfig =
  | { type: 'adaptive' }                    // Claude decides when/how much to think (Opus 4.6+)
  | { type: 'enabled'; budgetTokens?: number }  // Fixed thinking budget (budgetTokens now optional)
  | { type: 'disabled' };                   // No extended thinking
```

## SDKMessage Union Type

```ts
type SDKMessage =
  | { type: "assistant"; content: string }
  | { type: "tool_use"; toolName: string; toolInput: Record<string, unknown> }
  | { type: "tool_result"; toolName: string; content: string }
  | { type: "system"; content: string }
  | { type: "system"; subtype: "task_started"; task_id: string; description: string; prompt?: string; uuid: string; session_id: string }  // (v0.2.50+, uuid/session_id v0.2.51+, prompt v0.2.76+)
  | { type: "system"; subtype: "task_progress"; task_id: string; description: string; usage: { total_tokens: number; tool_uses: number; duration_ms: number }; last_tool_name?: string }  // (v0.2.51+)
  | { type: "error"; error: string; code?: string }
  | { type: "result"; content: string; sessionId: string }
  | { type: "progress"; progress: number; total?: number }
  | { type: "system"; subtype: "local_command_output"; content: string }  // Local slash command output (v0.2.63+)
  | { type: "system"; subtype: "elicitation_complete"; mcp_server_name: string; elicitation_id: string }  // MCP elicitation completed (v0.2.63+)
  | { type: "rate_limit_event"; rate_limit_info: SDKRateLimitInfo }  // Rate limit event with details (v0.2.63+)
  | { type: "prompt_suggestion"; suggestion: string };  // Prompt suggestion (v0.2.50+)
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
| `system` (subtype: `task_started`) | Task spawned (v0.2.50+) | `task_id`, `description`, `prompt` (v0.2.76+), `uuid`, `session_id` (v0.2.51+) |
| `system` (subtype: `task_progress`) | Task progress update (v0.2.51+) | `task_id`, `description`, `usage` (`total_tokens`, `tool_uses`, `duration_ms`), `last_tool_name` |
| `system` (subtype: `local_command_output`) | Local slash command output (v0.2.63+) | `content` |
| `system` (subtype: `elicitation_complete`) | MCP elicitation completed (v0.2.63+) | `mcp_server_name`, `elicitation_id` |
| `rate_limit_event` | Rate limit info changed (v0.2.63+) | `rate_limit_info` (`SDKRateLimitInfo`) |
| `prompt_suggestion` | Suggested next prompt (v0.2.50+) | `suggestion` |

## ToolUseDecision Type

```ts
type ToolUseDecision =
  | { allowed: true }
  | { allowed: false; reason: string }
  | undefined;  // Defer to permission mode
```

## `listSessions()` Function (v0.2.55+)

List sessions with metadata. Returns sessions for a project directory (and its git worktrees) or across all projects.

```ts
import { listSessions, type SDKSessionInfo, type ListSessionsOptions } from "@anthropic-ai/claude-agent-sdk";

const sessions: SDKSessionInfo[] = await listSessions(options?: ListSessionsOptions);
```

### ListSessionsOptions

```ts
interface ListSessionsOptions {
  dir?: string;              // Project directory to filter by (includes git worktrees). Omit for all projects.
  limit?: number;            // Maximum number of sessions to return.
  offset?: number;           // Number of sessions to skip (for pagination). Default: 0. (v0.2.76+)
  includeWorktrees?: boolean; // Include sessions from git worktree paths when dir is set. Default: true. (v0.2.70+)
}
```

### SDKSessionInfo

```ts
interface SDKSessionInfo {
  sessionId: string;       // Unique session identifier (UUID)
  summary: string;         // Display title: custom title, auto-generated summary, or first prompt
  lastModified: number;    // Last modified time (ms since epoch)
  fileSize?: number;       // File size in bytes (optional, local JSONL only; v0.2.76+)
  customTitle?: string;    // User-set title via /rename
  firstPrompt?: string;    // First meaningful user prompt
  gitBranch?: string;      // Git branch at session end
  cwd?: string;            // Working directory
  tag?: string;            // User-set session tag (v0.2.76+)
  createdAt?: number;      // Creation time in ms since epoch (v0.2.76+)
}
```

## `getSessionMessages()` Function (v0.2.59+)

Read user/assistant messages from a session's JSONL transcript file.

```ts
import { getSessionMessages, type SessionMessage, type GetSessionMessagesOptions } from "@anthropic-ai/claude-agent-sdk";

const messages: SessionMessage[] = await getSessionMessages(sessionId, options?: GetSessionMessagesOptions);
```

### GetSessionMessagesOptions

```ts
interface GetSessionMessagesOptions {
  dir?: string;     // Project directory to find the session in. Omit to search all projects.
  limit?: number;   // Maximum number of messages to return.
  offset?: number;  // Number of messages to skip from the start.
}
```

### SessionMessage

```ts
interface SessionMessage {
  type: 'user' | 'assistant';   // Message role
  uuid: string;                  // Unique message identifier
  session_id: string;            // Session this message belongs to
  message: unknown;              // Raw message content
  parent_tool_use_id: null;      // Reserved for future use
}
```

## `OnElicitation` Callback Type (v0.2.63+)

Called when an MCP server requests user input and no hook handles it. If not provided, elicitation requests are declined automatically.

```ts
type OnElicitation = (
  request: ElicitationRequest,
  options: { signal: AbortSignal }
) => Promise<ElicitationResult>;

interface ElicitationRequest {
  serverName: string;                          // MCP server requesting elicitation
  message: string;                             // Message to display to the user
  mode?: 'form' | 'url';                       // 'form' for structured input, 'url' for browser auth
  url?: string;                                // URL to open (only for 'url' mode)
  elicitationId?: string;                      // Correlation ID for URL elicitations
  requestedSchema?: Record<string, unknown>;   // JSON Schema for input (only for 'form' mode)
}

// ElicitationResult is re-exported from @modelcontextprotocol/sdk
// Common response: { action: 'accept', content: { ... } } | { action: 'decline' } | { action: 'cancel' }
```

## `SDKRateLimitInfo` Type (v0.2.63+)

Rate limit information for claude.ai subscription users.

```ts
interface SDKRateLimitInfo {
  status: 'allowed' | 'allowed_warning' | 'rejected';
  resetsAt?: number;
  rateLimitType?: 'five_hour' | 'seven_day' | 'seven_day_opus' | 'seven_day_sonnet' | 'overage';
  utilization?: number;
  overageStatus?: 'allowed' | 'allowed_warning' | 'rejected';
  overageResetsAt?: number;
  overageDisabledReason?: string;
  isUsingOverage?: boolean;
  surpassedThreshold?: number;
}
```

## `FastModeState` Type (v0.2.63+)

```ts
type FastModeState = 'off' | 'cooldown' | 'on';
```

Present as optional `fast_mode_state` field on `SDKStatusMessage` and `SDKResultMessage`.

## `ToolConfig` Type (v0.2.70+)

Per-tool configuration for built-in tools. Allows SDK consumers to customize tool behavior.

```ts
type ToolConfig = {
  askUserQuestion?: {
    /** Content format for the preview field on question options.
     *  'markdown' (default) — Markdown/ASCII content
     *  'html' — Self-contained HTML fragments (for web-based SDK consumers) */
    previewFormat?: 'markdown' | 'html';
  };
};
```

## `Settings` Type (v0.2.70+)

Full settings interface exported from the SDK. Can be passed inline to `query()` via `options.settings` or loaded from a JSON file path.

```ts
import { query, type Settings } from "@anthropic-ai/claude-agent-sdk";

// Inline settings object
const q = query({
  prompt: "Do the task",
  options: {
    settings: {
      model: 'claude-sonnet-4-6',
      permissions: { allow: ['Bash(*)'] },
    } satisfies Settings,
  },
});

// Or path to settings file
const q2 = query({
  prompt: "Do the task",
  options: { settings: '/path/to/settings.json' },
});
```

## Session Mutation Functions (v0.2.76+)

```ts
import { forkSession, getSessionInfo, renameSession, tagSession } from "@anthropic-ai/claude-agent-sdk";
```

### `forkSession(sessionId, options?)`

Fork a session into a new branch with fresh UUIDs.

```ts
const { sessionId: forkedId } = await forkSession(sessionId, {
  upToMessageId?: string;  // Slice transcript up to this UUID (inclusive)
  title?: string;          // Custom title (defaults to original + " (fork)")
  dir?: string;            // Project directory
});
```

### `getSessionInfo(sessionId, options?)`

Read metadata for a single session by ID (lighter than `listSessions`). Returns `undefined` if not found.

```ts
const info: SDKSessionInfo | undefined = await getSessionInfo(sessionId, { dir?: string });
```

### `renameSession(sessionId, title, options?)`

Set a custom title for a session.

```ts
await renameSession(sessionId, "New Title", { dir?: string });
```

### `tagSession(sessionId, tag, options?)`

Tag a session. Pass `null` to clear the tag.

```ts
await tagSession(sessionId, "important", { dir?: string });
await tagSession(sessionId, null);  // Clear tag
```

### `SessionMutationOptions`

Shared options for `forkSession`, `renameSession`, `tagSession`, and `deleteSession`.

```ts
interface SessionMutationOptions {
  dir?: string;  // Project directory path. Omit to search all projects.
}
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
  model?: string;                      // Model alias or full model ID (v0.2.76+: widened from union)
  permissionMode?: PermissionMode;
  tools?: Tool[];
  mcpServers?: MCPServerConfig[];
  systemPrompt?: string;
  maxTurns?: number;
  allowedTools?: string[];
  disallowedTools?: string[];
}
```
