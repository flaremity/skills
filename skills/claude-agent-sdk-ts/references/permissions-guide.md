# Permissions Guide

> `@anthropic-ai/claude-agent-sdk@0.2.52`

## Permission Modes

| Mode | File Read | File Write | Bash | MCP Tools |
|------|-----------|------------|------|-----------|
| `"default"` | Auto | Prompt | Prompt | Prompt |
| `"acceptEdits"` | Auto | Auto | Prompt | Prompt |
| `"bypassPermissions"` | Auto | Auto | Auto | Auto |
| `"plan"` | Auto | Blocked | Blocked | Blocked |

### `"default"`

Standard interactive mode. Safe reads are automatic; writes and commands prompt for approval.

```ts
query({ prompt, options: { permissionMode: "default" } });
```

### `"acceptEdits"`

Auto-allows file modifications (Write, Edit). Bash and MCP still prompt.

```ts
query({ prompt, options: { permissionMode: "acceptEdits" } });
```

### `"bypassPermissions"`

Everything is auto-allowed. **Only use in sandboxed environments.**

```ts
query({ prompt, options: { permissionMode: "bypassPermissions" } });
```

### `"plan"`

Read-only mode. Claude can explore but cannot modify anything.

```ts
query({ prompt, options: { permissionMode: "plan" } });
```

## `canUseTool` Callback

Fine-grained control per tool invocation. Called before the permission mode check.

```ts
canUseTool(toolName: string, toolInput: Record<string, unknown>): ToolUseDecision
```

### Decision Priority

1. `canUseTool` returns `{ allowed: true }` → **Allow** (bypasses permission mode)
2. `canUseTool` returns `{ allowed: false, reason }` → **Deny** (bypasses permission mode)
3. `canUseTool` returns `undefined` → **Defer** to permission mode

### Common Patterns

#### Path-based restrictions

```ts
canUseTool(name, input) {
  if (name === "Write" || name === "Edit") {
    const path = String(input.file_path ?? "");
    if (path.startsWith("/etc/") || path.startsWith("/usr/")) {
      return { allowed: false, reason: "System paths are read-only" };
    }
  }
  return undefined;
}
```

#### Command filtering

```ts
canUseTool(name, input) {
  if (name === "Bash") {
    const cmd = String(input.command ?? "");
    // Block network access
    if (/\b(curl|wget|ssh|nc)\b/.test(cmd)) {
      return { allowed: false, reason: "Network commands blocked" };
    }
  }
  return undefined;
}
```

#### Tool allowlist

```ts
const allowed = new Set(["Read", "Glob", "Grep"]);

canUseTool(name) {
  return allowed.has(name)
    ? { allowed: true }
    : { allowed: false, reason: `${name} not in allowlist` };
}
```

## Dynamic Permission Changes

Change permission mode during a query:

```ts
const q = query({ prompt, options: { permissionMode: "plan" } });

// After reviewing the plan, switch to allow edits
q.setPermissionMode("acceptEdits");
```

## Combining Permissions with Sandbox

```ts
query({
  prompt: "Run the test suite",
  options: {
    permissionMode: "bypassPermissions",
    sandbox: {
      type: "docker",
      image: "node:20-slim",
      network: false,
      mountPaths: ["/app"],
    },
  },
});
```

The sandbox provides OS-level isolation even with `bypassPermissions`.

### Sandbox Filesystem Config (v0.2.50+)

Fine-grained filesystem restrictions within the sandbox:

```ts
query({
  prompt: "Run the test suite",
  options: {
    permissionMode: "bypassPermissions",
    sandbox: {
      type: "docker",
      image: "node:20-slim",
      filesystem: {
        allowWrite: ["/app/src", "/app/dist"],  // Allowed write paths
        denyWrite: ["/app/node_modules"],         // Denied write paths
        denyRead: ["/app/.env"],                  // Denied read paths
      },
    },
  },
});
```

## Limitations

- `canUseTool` is **not called for MCP tools** — use `allowedTools`/`disallowedTools` instead
- `plan` mode still allows `Read`, `Glob`, `Grep`, `WebSearch`, `WebFetch`
- `bypassPermissions` cannot override Docker/sandbox restrictions
- Subagents inherit parent's `canUseTool` unless they define their own

## Best Practices

1. **Production:** Always use `canUseTool` — never rely on `bypassPermissions` alone
2. **Testing:** Use `bypassPermissions` + sandbox for CI/CD
3. **Code review:** Use `plan` mode for analysis-only tasks
4. **Layered security:** Combine `canUseTool` + permission mode + sandbox
5. **Log decisions:** Add audit logging in `canUseTool` for compliance
