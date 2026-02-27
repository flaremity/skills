---
name: claude-agent-sdk-ts
description: |
  TypeScript reference for @anthropic-ai/claude-agent-sdk — build AI agents with Claude Code.
  Keywords: claude sdk, agent sdk, claude code sdk, typescript agent, mcp server, subagent, multi-agent, claude api, anthropic sdk
user_invocable: true
---

# Claude Agent SDK — TypeScript Reference

> **Package:** `@anthropic-ai/claude-agent-sdk@0.2.62`
> **Runtime:** Node.js 18+ / Bun 1.0+
> **Last verified:** 2026-02-27

## Quick Start

```bash
# Install
npm install @anthropic-ai/claude-agent-sdk
# or
bun add @anthropic-ai/claude-agent-sdk
```

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";

const q = query({
  prompt: "Write a hello world function in TypeScript",
  options: {
    maxTurns: 3,
  },
});

for await (const message of q) {
  if (message.type === "assistant") {
    process.stdout.write(message.content);
  }
}
```

## Core API

### `query(options)` — V1 Stable API

Creates an async generator that yields `SDKMessage` events.

```ts
import { query, type QueryOptions, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

const q: Query = query({
  prompt: "Your prompt here",
  options: { /* QueryOptions */ },
});

for await (const message of q) {
  // Handle messages
}

const result = await q.result; // Final result after iteration
```

#### Query Methods

| Method | Description |
|--------|-------------|
| `q.result` | `Promise<QueryResult>` — final result after generator completes |
| `q.interrupt()` | Interrupt current generation |
| `q.rewindFiles()` | Revert file changes to pre-query state |
| `q.setPermissionMode(mode)` | Change permission mode mid-query |
| `q.setModel(model)` | Change model mid-query |
| `q.close()` | Close the query and free resources (added v0.2.15) |

#### QueryResult

```ts
interface QueryResult {
  sessionId: string;
  totalCost: number;       // USD
  totalInput: number;      // Input tokens
  totalOutput: number;     // Output tokens
  duration: number;        // Milliseconds
  numTurns: number;
  stop_reason: string;     // "end_turn" | "max_turns" | "interrupt" (added v0.2.31)
}
```

### V2 Preview API

Simplified multi-turn session management. All functions are `unstable_` prefixed.

```ts
import {
  unstable_v2_prompt,
  unstable_v2_createSession,
  unstable_v2_resumeSession,
} from "@anthropic-ai/claude-agent-sdk";
```

#### Single-turn (V2)

```ts
const result = await unstable_v2_prompt({
  prompt: "Explain async generators",
  options: { maxTurns: 1 },
});
// result: QueryResult
```

#### Multi-turn Session (V2)

```ts
// Create a new session
await using session = unstable_v2_createSession({ options });

// Send a message and stream responses
const stream = session.stream("Build a REST API");
for await (const message of stream) {
  // Handle messages
}

// Send follow-up
const stream2 = session.stream("Add authentication");
for await (const message of stream2) {
  // Handle messages
}

// Resume an existing session
await using resumed = unstable_v2_resumeSession(sessionId, { options });
```

> **Note:** V2 uses `stream()` (renamed from `receive()` in v0.2.72+).
> Sessions implement `AsyncDisposable` — use `await using` for automatic cleanup.

---

## Options Reference

### QueryOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prompt` | `string` | *required* | The user prompt |
| `options.model` | `string` | `"sonnet"` | Model: `"sonnet"`, `"opus"`, `"haiku"` |
| `options.systemPrompt` | `string` | `undefined` | System prompt prepended to conversation |
| `options.appendSystemPrompt` | `string` | `undefined` | Appended after default system prompt |
| `options.maxTurns` | `number` | `Infinity` | Max agentic turns (API round-trips) |
| `options.permissionMode` | `PermissionMode` | `"default"` | `"default"` \| `"acceptEdits"` \| `"bypassPermissions"` \| `"plan"` |
| `options.canUseTool` | `(tool, input) => Decision` | `undefined` | Per-tool permission callback |
| `options.tools` | `Tool[]` | `[]` | Custom tools via `tool()` helper |
| `options.mcpServers` | `MCPServerConfig[]` | `[]` | MCP server connections |
| `options.subagents` | `AgentDefinition[]` | `[]` | Subagent definitions |
| `options.allowedTools` | `string[]` | `undefined` | Whitelist of tool names |
| `options.disallowedTools` | `string[]` | `undefined` | Blacklist of tool names |
| `options.cwd` | `string` | `process.cwd()` | Working directory |
| `options.sessionId` | `string` | auto-generated | Custom session ID (added v0.2.33) |
| `options.resume` | `{ sessionId, transcript }` | `undefined` | Resume a previous session |
| `options.contextWindow` | `number` | model default | Context window size in tokens |
| `options.maxCachePoints` | `number` | `undefined` | Max prompt caching breakpoints |
| `options.debug` | `boolean` | `false` | Enable debug logging (added v0.2.30) |
| `options.debugFile` | `string` | `undefined` | Write debug logs to file (added v0.2.30) |
| `options.enableFileCheckpointing` | `boolean` | `false` | Enable file state checkpointing |
| `options.outputFormat` | `OutputFormat` | `undefined` | Structured output format |
| `options.sandbox` | `SandboxSettings` | `undefined` | Sandbox configuration |
| `options.additionalDirectories` | `string[]` | `[]` | Extra dirs for CLAUDE.md loading (added v0.2.19) |
| `options.betaFeatures` | `string[]` | `[]` | Beta feature flags |
| `options.thinking` | `ThinkingConfig` | `undefined` | Thinking/reasoning behavior: `{ type: 'adaptive' }`, `{ type: 'enabled', budgetTokens?: number }`, or `{ type: 'disabled' }` (v0.2.50+) |
| `options.promptSuggestions` | `boolean` | `undefined` | Enable prompt suggestions after each turn (v0.2.50+) |
| `options.hooks` | `HookConfig` | `undefined` | Event hook configuration |

### Permission Modes

| Mode | Behavior |
|------|----------|
| `"default"` | Prompts for dangerous tools, auto-allows safe reads |
| `"acceptEdits"` | Auto-allows file edits, prompts for Bash |
| `"bypassPermissions"` | Auto-allows everything — **use only in sandboxed environments** |
| `"plan"` | Read-only exploration, no writes allowed |

### canUseTool Callback

```ts
import { query, type ToolUseDecision } from "@anthropic-ai/claude-agent-sdk";

const q = query({
  prompt: "Refactor the auth module",
  options: {
    canUseTool(toolName: string, toolInput: Record<string, unknown>): ToolUseDecision {
      // Allow all read operations
      if (toolName === "Read" || toolName === "Glob" || toolName === "Grep") {
        return { allowed: true };
      }

      // Block dangerous commands
      if (toolName === "Bash" && String(toolInput.command).includes("rm -rf")) {
        return { allowed: false, reason: "Destructive commands not allowed" };
      }

      // Defer to permission mode for everything else
      return undefined;
    },
  },
});
```

**Return values:**
- `{ allowed: true }` — Allow the tool use
- `{ allowed: false, reason: string }` — Deny with reason
- `undefined` — Defer to permission mode

---

## Tool Integration

### Custom Tools with `tool()`

```ts
import { query, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const weatherTool = tool({
  name: "get_weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    city: z.string().describe("City name"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
  }),
  async execute(input) {
    const data = await fetchWeather(input.city, input.units);
    return { content: JSON.stringify(data) };
  },
  // Tool annotations (added v0.2.27)
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
    idempotentHint: true,
  },
});

const q = query({
  prompt: "What's the weather in Tokyo?",
  options: {
    tools: [weatherTool],
    maxTurns: 5,
  },
});
```

### MCP Servers

Four transport types supported:

```ts
const q = query({
  prompt: "List my issues",
  options: {
    mcpServers: [
      // 1. stdio — spawns a subprocess
      {
        type: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN! },
      },

      // 2. sse — Server-Sent Events (legacy)
      {
        type: "sse",
        url: "http://localhost:3001/sse",
        headers: { Authorization: `Bearer ${token}` },
      },

      // 3. http — Streamable HTTP (recommended for remote)
      {
        type: "http",
        url: "https://mcp.example.com/mcp",
        headers: { Authorization: `Bearer ${token}` },
      },

      // 4. sdk — In-process MCP server (zero network overhead)
      {
        type: "sdk",
        server: myMcpServer,        // McpServer instance
        serverName: "my-tools",
      },
    ],
  },
});
```

### In-Process MCP Server with `createSdkMcpServer()`

```ts
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const mcpServer = new McpServer({ name: "my-tools", version: "1.0.0" });

mcpServer.tool("calculate", { expression: z.string() }, async ({ expression }) => ({
  content: [{ type: "text", text: String(eval(expression)) }],
}));

const q = query({
  prompt: "What is 42 * 37?",
  options: {
    mcpServers: [{ type: "sdk", server: mcpServer, serverName: "my-tools" }],
  },
});
```

#### MCP Server Management (v0.2.21+)

```ts
// Reconnect a server
await q.reconnectMcpServer("my-tools");

// Toggle server on/off
await q.toggleMcpServer("my-tools", false); // disable
await q.toggleMcpServer("my-tools", true);  // enable
```

---

## Subagents

Define subagents that Claude can spawn to handle specialized tasks.

```ts
import { query, tool, type AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

const agents: AgentDefinition[] = [
  {
    name: "researcher",
    description: "Searches the web and gathers information on a topic",
    model: "haiku",
    permissionMode: "bypassPermissions",
    tools: [searchTool],
    mcpServers: [{ type: "stdio", command: "npx", args: ["web-search-server"] }],
    systemPrompt: "You are a research assistant. Be thorough and cite sources.",
    maxTurns: 10,
  },
  {
    name: "coder",
    description: "Writes and tests TypeScript code",
    model: "sonnet",
    permissionMode: "acceptEdits",
    systemPrompt: "Write clean, tested TypeScript code.",
    maxTurns: 20,
  },
];

const q = query({
  prompt: "Research React Server Components and implement a demo",
  options: {
    subagents: agents,
    maxTurns: 30,
  },
});
```

### AgentDefinition Type

```ts
interface AgentDefinition {
  name: string;                        // Agent name (used as tool name)
  description: string;                 // What the agent does
  model?: string;                      // Model override
  permissionMode?: PermissionMode;     // Permission mode for the agent
  tools?: Tool[];                      // Custom tools
  mcpServers?: MCPServerConfig[];      // MCP servers
  systemPrompt?: string;               // System prompt
  maxTurns?: number;                   // Max turns
  allowedTools?: string[];             // Tool whitelist
  disallowedTools?: string[];          // Tool blacklist
}
```

---

## Session Management

### V1 — Resume and Fork

```ts
// First query
const q1 = query({ prompt: "Create a project structure", options });
for await (const msg of q1) { /* ... */ }
const result1 = await q1.result;

// Resume the session (continues conversation)
const q2 = query({
  prompt: "Now add tests",
  options: {
    ...options,
    resume: {
      sessionId: result1.sessionId,
      transcript: [], // SDK manages internally
    },
  },
});

// Fork (branch from a point)
const q3 = query({
  prompt: "Try a different approach",
  options: {
    ...options,
    resume: {
      sessionId: result1.sessionId,
      transcript: [],
    },
  },
});
```

### V2 — Session Objects

```ts
import { unstable_v2_createSession, unstable_v2_resumeSession } from "@anthropic-ai/claude-agent-sdk";

// Create session
await using session = unstable_v2_createSession({
  options: { model: "sonnet", systemPrompt: "You are helpful." },
});

// First turn
for await (const msg of session.stream("Build a CLI tool")) { /* ... */ }

// Second turn (same session)
for await (const msg of session.stream("Add --verbose flag")) { /* ... */ }

// Later: resume
await using resumed = unstable_v2_resumeSession(session.sessionId, { options });
for await (const msg of resumed.stream("Add --help flag")) { /* ... */ }
```

### Listing Sessions (v0.2.55+)

```ts
import { listSessions, type SDKSessionInfo } from "@anthropic-ai/claude-agent-sdk";

// List sessions for a specific project
const sessions: SDKSessionInfo[] = await listSessions({ dir: '/path/to/project' });

// List all sessions across all projects
const allSessions = await listSessions();

// Limit results
const recentSessions = await listSessions({ dir: '/path/to/project', limit: 10 });
```

#### SDKSessionInfo

```ts
interface SDKSessionInfo {
  sessionId: string;       // Unique session identifier (UUID)
  summary: string;         // Display title: custom title, auto-generated summary, or first prompt
  lastModified: number;    // Last modified time (ms since epoch)
  fileSize: number;        // Session file size in bytes
  customTitle?: string;    // User-set title via /rename
  firstPrompt?: string;    // First meaningful user prompt
  gitBranch?: string;      // Git branch at session end
  cwd?: string;            // Working directory
}
```

### Reading Session Messages (v0.2.59+)

Read historical messages from a session transcript.

```ts
import { getSessionMessages, type SessionMessage } from "@anthropic-ai/claude-agent-sdk";

// Read all messages from a session
const messages: SessionMessage[] = await getSessionMessages(sessionId);

// Read messages from a specific project directory
const messages2 = await getSessionMessages(sessionId, { dir: '/path/to/project' });

// Paginate through messages
const page = await getSessionMessages(sessionId, { limit: 20, offset: 0 });
```

#### SessionMessage

```ts
interface SessionMessage {
  type: 'user' | 'assistant';
  uuid: string;
  session_id: string;
  message: unknown;
  parent_tool_use_id: null;
}
```

### File Checkpointing

```ts
const q = query({
  prompt: "Refactor the codebase",
  options: {
    enableFileCheckpointing: true,
  },
});

// If something goes wrong, rewind all file changes
q.rewindFiles();
```

---

## Hooks

Event hooks let you react to SDK lifecycle events. Added incrementally across versions.

### Hook Events

| Event | Since | Description |
|-------|-------|-------------|
| `PreToolUse` | v0.2.0 | Before a tool is executed |
| `PostToolUse` | v0.2.0 | After a tool completes |
| `Notification` | v0.2.15 | Agent sends a notification |
| `PermissionRequest` | v0.2.15 | Permission prompt triggered |
| `Stop` | v0.2.0 | Agent stops |
| `SubagentStop` | v0.2.0 | Subagent stops |
| `TeammateIdle` | v0.2.33 | Teammate goes idle |
| `TaskCompleted` | v0.2.33 | Task marked complete |
| `ConfigChange` | v0.2.50 | Configuration file changed (source: user/project/local/policy/skills) |
| `WorktreeCreate` | v0.2.50 | Git worktree created |
| `WorktreeRemove` | v0.2.50 | Git worktree removed |

### Hook Configuration

```ts
const q = query({
  prompt: "Do the task",
  options: {
    hooks: {
      PreToolUse: [
        {
          matcher: "Bash",
          handler: async (event) => {
            console.log(`Running: ${event.toolInput.command}`);
            return { proceed: true }; // or { proceed: false, reason: "blocked" }
          },
        },
      ],
      PostToolUse: [
        {
          matcher: "*", // Match all tools
          handler: async (event) => {
            console.log(`Tool ${event.toolName} completed`);
          },
        },
      ],
      Notification: [
        {
          handler: async (event) => {
            console.log(`Notification: ${event.message}`);
          },
        },
      ],
    },
  },
});
```

---

## Structured Output

Force Claude to return structured data using Zod schemas.

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const q = query({
  prompt: "Analyze this code for bugs",
  options: {
    outputFormat: {
      type: "json",
      schema: z.object({
        bugs: z.array(z.object({
          file: z.string(),
          line: z.number(),
          severity: z.enum(["low", "medium", "high", "critical"]),
          description: z.string(),
          fix: z.string(),
        })),
        summary: z.string(),
      }),
    },
    maxTurns: 5,
  },
});

for await (const msg of q) {
  if (msg.type === "result") {
    const parsed = JSON.parse(msg.content);
    // parsed is typed according to schema
  }
}
```

---

## Sandbox Settings

Configure sandbox behavior for safe execution.

```ts
const q = query({
  prompt: "Run the test suite",
  options: {
    sandbox: {
      type: "docker",                     // "docker" | "none"
      image: "node:20-slim",
      network: false,                     // Disable network
      mountPaths: ["/app"],               // Paths to mount
      maxMemory: "512m",
      maxCpus: 2,
      filesystem: {                       // Filesystem restrictions (v0.2.50+)
        allowWrite: ["/app/src"],         // Directories allowed for writes
        denyWrite: ["/app/node_modules"], // Directories denied for writes
        denyRead: ["/app/.env"],          // Directories denied for reads
      },
    },
  },
});
```

---

## SDKMessage Types

The async generator yields these message types:

```ts
type SDKMessage =
  | { type: "assistant"; content: string }          // Text from Claude
  | { type: "tool_use"; toolName: string; toolInput: Record<string, unknown> }
  | { type: "tool_result"; toolName: string; content: string }
  | { type: "system"; content: string }             // System messages
  | { type: "system"; subtype: "task_started"; task_id: string; description: string; uuid: string; session_id: string }  // (v0.2.50+, uuid/session_id v0.2.51+)
  | { type: "system"; subtype: "task_progress"; task_id: string; description: string; usage: { total_tokens: number; tool_uses: number; duration_ms: number }; last_tool_name?: string }  // (v0.2.51+)
  | { type: "error"; error: string; code?: string }
  | { type: "result"; content: string; sessionId: string }
  | { type: "progress"; progress: number; total?: number }
  | { type: "rate_limit" }                          // Rate limit event (v0.2.50+)
  | { type: "prompt_suggestion"; suggestion: string };  // Prompt suggestion (v0.2.50+)
```

### Filtering Messages

```ts
for await (const msg of q) {
  switch (msg.type) {
    case "assistant":
      process.stdout.write(msg.content);
      break;
    case "tool_use":
      console.log(`Using tool: ${msg.toolName}`);
      break;
    case "tool_result":
      console.log(`Result: ${msg.content.slice(0, 100)}`);
      break;
    case "error":
      console.error(`Error: ${msg.error}`);
      break;
  }
}
```

---

## Beta Features

### 1M Context Window

```ts
const q = query({
  prompt: "Analyze this entire codebase",
  options: {
    betaFeatures: ["context-1m-2025-08-07"],
    contextWindow: 1_000_000,
  },
});
```

---

## Error Handling

### Exit / Stop Reasons

| Reason | Meaning |
|--------|---------|
| `"end_turn"` | Normal completion |
| `"max_turns"` | Reached maxTurns limit |
| `"interrupt"` | `q.interrupt()` was called |
| `"error"` | An error occurred |
| `"tool_error"` | A tool execution failed |

### Comprehensive Error Handling

```ts
try {
  const q = query({ prompt, options });

  for await (const msg of q) {
    if (msg.type === "error") {
      console.error(`SDK Error [${msg.code}]: ${msg.error}`);
    }
  }

  const result = await q.result;
  console.log(`Completed: ${result.stop_reason}, cost: $${result.totalCost.toFixed(4)}`);
} catch (error) {
  if (error instanceof Error) {
    // Connection errors, auth errors, etc.
    console.error("Fatal:", error.message);
  }
} finally {
  // Cleanup if needed
  q?.close();
}
```

---

## Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| `maxTurns: 1` may not stop after first turn | Use `maxTurns: 2` or `q.interrupt()` as fallback |
| MCP stdio servers may hang on exit | Set timeout on child process, use `q.close()` |
| `resume` requires matching model | Always pass same `model` when resuming |
| `bypassPermissions` still blocked in Docker | Ensure Docker socket is accessible |
| V2 `receive()` renamed to `stream()` | Use `stream()` for v0.2.72+, `receive()` for older |
| Large `systemPrompt` reduces effective context | Keep system prompts concise, use CLAUDE.md for context |
| `canUseTool` not called for MCP tools | Known limitation — use `allowedTools`/`disallowedTools` instead |

---

## Settings Priority

Settings are loaded in order (later overrides earlier):

1. **Default** — SDK built-in defaults
2. **User** — `~/.claude/settings.json`
3. **Project** — `.claude/settings.json` in working directory
4. **Local** — `.claude/settings.local.json` in working directory
5. **Query options** — Options passed to `query()` (highest priority)

---

## Version History (Recent)

| Version | Key Change |
|---------|-----------|
| v0.2.62 | Maintenance release |
| v0.2.59 | `getSessionMessages()` function, `GetSessionMessagesOptions` type, `SessionMessage` type for reading session transcripts |
| v0.2.55 | `listSessions()` function, `ListSessionsOptions` type, `SDKSessionInfo` type for session discovery |
| v0.2.52 | Maintenance release |
| v0.2.51 | `SDKTaskProgressMessage` type, new fields on `SDKTaskStartedMessage` (`uuid`, `session_id`), MCP auth control requests |
| v0.2.50 | New hook events (`ConfigChange`, `WorktreeCreate`, `WorktreeRemove`), `ThinkingConfig` types, `promptSuggestions` option, sandbox `filesystem` config, `SDKTaskStartedMessage`, removed `delegate` permission mode |
| v0.2.33 | `TeammateIdle`/`TaskCompleted` hooks, custom `sessionId` |
| v0.2.31 | `stop_reason` in QueryResult |
| v0.2.30 | `debug`/`debugFile` options |
| v0.2.27 | Tool annotations (`readOnlyHint`, `destructiveHint`, etc.) |
| v0.2.21 | MCP introspection (`reconnectMcpServer`, `toggleMcpServer`) |
| v0.2.19 | `additionalDirectories` for CLAUDE.md |
| v0.2.15 | Notification hooks, `close()` method |

---

*Based on claude-agent-sdk skill by Jeremy Dawes ([jezweb/claude-skills](https://github.com/jezweb/claude-skills), MIT License). Updated and expanded for SDK v0.2.62.*
