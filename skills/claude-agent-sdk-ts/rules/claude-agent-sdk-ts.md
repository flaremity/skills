---
description: Auto-correction rules for Claude Agent SDK TypeScript development
globs:
  - "**/*agent*.ts"
  - "**/*sdk*.ts"
  - "**/*claude*.ts"
alwaysApply: false
---

# Claude Agent SDK — TypeScript Rules

## Import Rules

- **Correct import path:** `@anthropic-ai/claude-agent-sdk` (NOT `@anthropic-ai/claude-sdk` or `@anthropic-ai/sdk`)
- **Named imports only:** Use `import { query, tool } from "@anthropic-ai/claude-agent-sdk"` (NOT default import)
- **MCP SDK import:** `@modelcontextprotocol/sdk/server/mcp.js` (NOT `@modelcontextprotocol/server`)

## Tool Naming

- MCP tools use double underscores: `mcp__serverName__toolName`
- Custom tools via `tool()` use single names: `"get_weather"`, `"search_docs"`
- Subagent names become tool names — keep them simple: `"researcher"`, `"coder"`

## Required Options

- **Always set `systemPrompt`** in production — without it, Claude uses the default CLI prompt which may not match your use case
- **Always set `maxTurns`** — default is `Infinity`, which can cause runaway costs
- **Always set `canUseTool` or explicit `permissionMode`** — never rely on defaults for production

## Permission Safety

- **Never use `bypassPermissions` without a sandbox** — it allows arbitrary code execution
- **Always implement `canUseTool`** when not using `bypassPermissions` — it's the primary safety mechanism
- **`canUseTool` does NOT apply to MCP tools** — use `allowedTools`/`disallowedTools` for MCP control

## Subagent Rules

- **Always provide `description`** — without it, Claude doesn't know when to use the agent
- **Set `maxTurns` per agent** — prevent subagents from running indefinitely
- **Set `permissionMode` per agent** — don't inherit parent's mode blindly

## Session Management

- **Call `q.close()` in `finally`** — prevents resource leaks, especially with stdio MCP servers
- **Use `await using` for V2 sessions** — automatic cleanup via `AsyncDisposable`
- **Same model for resume** — always pass the same `model` when resuming a session
- **Store session metadata** — save `sessionId` + `model` together for reliable resumption

## V2 API

- **All V2 functions are `unstable_` prefixed** — `unstable_v2_prompt`, `unstable_v2_createSession`, `unstable_v2_resumeSession`
- **Use `stream()`** not `receive()` — renamed in v0.2.72+

## `tool()` Helper

- **Input schema must be Zod** — `inputSchema: z.object({ ... })`
- **`execute` must return `{ content: string }`** — not a plain string
- **Tool annotations are optional but recommended** — `readOnlyHint`, `destructiveHint`, `openWorldHint`, `idempotentHint`

## Settings Priority

Settings override order (highest wins):
1. Query `options` (code)
2. `.claude/settings.local.json` (local)
3. `.claude/settings.json` (project)
4. `~/.claude/settings.json` (user)
5. SDK defaults

## Error Handling

- **Always handle `msg.type === "error"`** in the message loop
- **Check `result.stop_reason`** after query completes — don't assume success
- **Use `enableFileCheckpointing: true`** for risky operations + `q.rewindFiles()` on failure
- **`rewindFiles()` only tracks Write/Edit** — Bash file changes are NOT tracked

## Anti-Patterns

- ❌ `query({ prompt })` with no options — missing model, maxTurns, permissions
- ❌ `permissionMode: "bypassPermissions"` without sandbox — security risk
- ❌ Not calling `q.close()` — resource leak
- ❌ Resuming with different model — causes errors
- ❌ Giant `systemPrompt` — wastes context window tokens
- ❌ `maxTurns: 1` for strict single-turn — use interrupt pattern instead
