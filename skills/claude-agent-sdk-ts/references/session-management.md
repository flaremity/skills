# Session Management

> `@anthropic-ai/claude-agent-sdk@0.2.50`

## Overview

Sessions allow multi-turn conversations with Claude. Two APIs:
- **V1 (Stable):** Manual resume via `query()` options
- **V2 (Preview):** Session objects with `unstable_v2_*` functions

## V1 Session Management

### Creating a Session

Every `query()` call creates a session. The session ID is in the result.

```ts
const q = query({ prompt: "Start a project", options });
for await (const msg of q) { /* ... */ }
const result = await q.result;
const sessionId = result.sessionId;
```

### Resuming a Session

Pass the previous session ID to continue the conversation.

```ts
const q2 = query({
  prompt: "Continue with tests",
  options: {
    ...options,
    resume: {
      sessionId: previousSessionId,
      transcript: [],  // SDK manages transcript internally
    },
  },
});
```

**Important:** Use the same `model` when resuming. Mismatched models may cause errors.

### Forking a Session

Create a branch from an existing session point. Both branches are independent.

```ts
// Branch A
const qA = query({
  prompt: "Try approach A: use Redis",
  options: { ...options, resume: { sessionId, transcript: [] } },
});

// Branch B (independent)
const qB = query({
  prompt: "Try approach B: use Memcached",
  options: { ...options, resume: { sessionId, transcript: [] } },
});
```

## V2 Session Management (Preview)

### Single-Turn

```ts
import { unstable_v2_prompt } from "@anthropic-ai/claude-agent-sdk";

const result = await unstable_v2_prompt({
  prompt: "Explain closures",
  options: { model: "haiku", maxTurns: 1 },
});
```

### Multi-Turn

```ts
import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";

await using session = unstable_v2_createSession({
  options: { model: "sonnet", maxTurns: 10 },
});

// Turn 1
for await (const msg of session.stream("Build a CLI")) { /* ... */ }

// Turn 2 (same context)
for await (const msg of session.stream("Add --verbose")) { /* ... */ }
```

### Resuming V2 Session

```ts
import { unstable_v2_resumeSession } from "@anthropic-ai/claude-agent-sdk";

await using session = unstable_v2_resumeSession(savedSessionId, {
  options: { model: "sonnet" },
});

for await (const msg of session.stream("Continue from where we left off")) {
  /* ... */
}
```

### Resource Cleanup

V2 sessions implement `AsyncDisposable`:

```ts
// Option 1: await using (recommended)
await using session = unstable_v2_createSession({ options });

// Option 2: manual cleanup
const session = unstable_v2_createSession({ options });
try {
  // use session
} finally {
  await session[Symbol.asyncDispose]();
}
```

## File Checkpointing

Track and revert file changes within a session.

```ts
const q = query({
  prompt: "Refactor everything",
  options: { enableFileCheckpointing: true },
});

for await (const msg of q) { /* ... */ }

// Something went wrong? Revert all changes
q.rewindFiles();
```

**Note:** Checkpointing tracks file writes/edits made by Claude. It does not track Bash command side effects.

## Custom Session IDs (v0.2.33+)

```ts
const q = query({
  prompt: "Task",
  options: { sessionId: "my-custom-id-12345" },
});
```

Useful for correlating sessions with external systems (task trackers, logs, etc.).

## Session Storage

Sessions are stored in `~/.claude/sessions/` by default. Each session is a directory containing:
- `transcript.jsonl` — conversation history
- `checkpoints/` — file checkpoints (if enabled)

## Best Practices

1. **Always close queries** — use `q.close()` or V2's `await using`
2. **Same model for resume** — mismatched models cause errors
3. **Enable checkpointing** for risky operations
4. **Use V2 for multi-turn** — cleaner API, automatic cleanup
5. **Custom session IDs** for traceability in production
