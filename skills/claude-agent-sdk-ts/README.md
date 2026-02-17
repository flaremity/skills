# claude-agent-sdk-ts

> Claude Agent SDK — TypeScript Reference Skill for Claude Code

A comprehensive reference skill for developing TypeScript applications with [`@anthropic-ai/claude-agent-sdk`](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk).

**SDK Version:** `0.2.44`

## What's Included

| Path | Description |
|------|-------------|
| `SKILL.md` | Complete API reference — query, sessions, tools, subagents, hooks |
| `rules/` | Auto-correction rules for common mistakes |
| `templates/` | 8 ready-to-use TypeScript examples |
| `references/` | Deep-dive guides for specific topics |
| `scripts/` | Utility scripts |

## Installation

### Option 1: Claude Code Plugin Marketplace

```bash
claude skill install flaremity/skills/claude-agent-sdk-ts
```

### Option 2: Manual (Git Clone)

```bash
cd ~/.claude/skills/
git clone https://github.com/flaremity/skills.git flaremity-skills
```

Then reference in your project's `.claude/settings.json`:

```json
{
  "skills": ["~/.claude/skills/flaremity-skills/skills/claude-agent-sdk-ts"]
}
```

## Quick Start

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";

const q = query({
  prompt: "Write a hello world in TypeScript",
  options: {
    model: "sonnet",
    maxTurns: 3,
  },
});

for await (const message of q) {
  if (message.type === "assistant") {
    process.stdout.write(message.content);
  }
}
```

## Templates

| Template | Description |
|----------|-------------|
| `basic-query.ts` | Simple single-turn query |
| `session-management.ts` | V1 resume + V2 multi-turn sessions |
| `multi-agent-workflow.ts` | Subagent orchestration |
| `custom-mcp-server.ts` | In-process MCP server |
| `permission-control.ts` | canUseTool patterns |
| `structured-output.ts` | JSON output with Zod schemas |
| `error-handling.ts` | Retry, timeout, rewind patterns |
| `hooks-example.ts` | All hook event types |

## References

| Guide | Topic |
|-------|-------|
| `query-api-reference.md` | Complete Options type + Query methods |
| `mcp-servers-guide.md` | All MCP transport types |
| `session-management.md` | Sessions, forking, V2 API |
| `permissions-guide.md` | Permission modes + canUseTool |
| `known-issues.md` | Issues + workarounds |

## Credits

Based on [jezweb/claude-skills](https://github.com/jezweb/claude-skills) (MIT License). Updated and expanded for SDK v0.2.44.

## License

MIT — see [LICENSE](./LICENSE)
