# Known Issues & Workarounds

> `@anthropic-ai/claude-agent-sdk@0.2.50` — Last updated: 2026-02-21

## Active Issues

### 1. `maxTurns: 1` May Not Stop Immediately

**Problem:** Setting `maxTurns: 1` sometimes allows 2 turns before stopping.

**Workaround:** Use `maxTurns: 2` and call `q.interrupt()` after the first assistant message if you need strict single-turn.

```ts
const q = query({ prompt, options: { maxTurns: 2 } });
for await (const msg of q) {
  if (msg.type === "assistant") {
    process.stdout.write(msg.content);
    q.interrupt();
  }
}
```

---

### 2. MCP stdio Servers May Hang on Exit

**Problem:** Child processes spawned for stdio MCP servers may not terminate when the query ends.

**Workaround:** Always call `q.close()` in a `finally` block:

```ts
const q = query({ prompt, options: { mcpServers: [stdioServer] } });
try {
  for await (const msg of q) { /* ... */ }
} finally {
  q.close();
}
```

---

### 3. `canUseTool` Not Called for MCP Tools

**Problem:** The `canUseTool` callback is not invoked for tools provided by MCP servers.

**Workaround:** Use `allowedTools` or `disallowedTools` to control MCP tool access:

```ts
query({
  prompt,
  options: {
    mcpServers: [myServer],
    allowedTools: ["mcp__myserver__safe_tool"],
    // or
    disallowedTools: ["mcp__myserver__dangerous_tool"],
  },
});
```

---

### 4. Resume Requires Same Model

**Problem:** Resuming a session with a different model than the original may cause errors or unexpected behavior.

**Workaround:** Always store and reuse the model alongside the session ID:

```ts
const sessionData = {
  sessionId: result.sessionId,
  model: "sonnet",
};
// When resuming:
query({ prompt, options: { model: sessionData.model, resume: { sessionId: sessionData.sessionId, transcript: [] } } });
```

---

### 5. Large systemPrompt Reduces Context

**Problem:** Very large `systemPrompt` values consume context window tokens, leaving less room for conversation.

**Workaround:**
- Keep `systemPrompt` under 2000 tokens
- Use `appendSystemPrompt` for additions (preserves SDK defaults)
- Put detailed instructions in CLAUDE.md files and use `additionalDirectories`

---

### 6. File Checkpointing Doesn't Track Bash Side Effects

**Problem:** `rewindFiles()` only reverts changes made through Write/Edit tools. File changes from Bash commands (e.g., `mv`, `cp`, `sed`) are not tracked.

**Workaround:** Use `canUseTool` to block Bash file operations when checkpointing is critical:

```ts
canUseTool(name, input) {
  if (name === "Bash") {
    const cmd = String(input.command ?? "");
    if (/\b(mv|cp|rm|sed|awk|tee|>|>>)\b/.test(cmd)) {
      return { allowed: false, reason: "Use Write/Edit tools for tracked changes" };
    }
  }
  return undefined;
}
```

---

### 7. V2 `receive()` vs `stream()` Naming

**Problem:** V2 API renamed `receive()` to `stream()` in v0.2.72+.

**Workaround:** Use `stream()` for current versions. If targeting older versions:

```ts
const method = "stream" in session ? "stream" : "receive";
for await (const msg of session[method]("prompt")) { /* ... */ }
```

---

## Resolved Issues (Historical)

| Version | Issue | Resolution |
|---------|-------|-----------|
| v0.2.15 | No way to clean up resources | Added `q.close()` |
| v0.2.21 | Can't reconnect failed MCP servers | Added `reconnectMcpServer()` |
| v0.2.27 | No tool metadata | Added tool annotations |
| v0.2.30 | Hard to debug SDK issues | Added `debug`/`debugFile` |
| v0.2.31 | No way to know why query stopped | Added `stop_reason` |
| v0.2.33 | No team coordination events | Added `TeammateIdle`/`TaskCompleted` hooks |

## Debugging Tips

1. **Enable debug mode:**
   ```ts
   options: { debug: true, debugFile: "./sdk-debug.log" }
   ```

2. **Check stop reason:**
   ```ts
   const result = await q.result;
   if (result.stop_reason !== "end_turn") {
     console.warn(`Unexpected stop: ${result.stop_reason}`);
   }
   ```

3. **Monitor token usage:**
   ```ts
   const result = await q.result;
   console.log(`Input: ${result.totalInput}, Output: ${result.totalOutput}`);
   ```

4. **Track MCP server health:** Use `PostToolUse` hooks to monitor MCP tool response times.
