/**
 * Permission control — canUseTool patterns
 * @anthropic-ai/claude-agent-sdk@0.2.50
 */
import { query, type ToolUseDecision } from "@anthropic-ai/claude-agent-sdk";

// Pattern 1: Allowlist approach
function allowlistPermissions(toolName: string, toolInput: Record<string, unknown>): ToolUseDecision {
  const safeTools = new Set(["Read", "Glob", "Grep", "WebSearch", "WebFetch"]);
  if (safeTools.has(toolName)) return { allowed: true };
  return { allowed: false, reason: `Tool ${toolName} is not in the allowlist` };
}

// Pattern 2: Blocklist approach
function blocklistPermissions(toolName: string, toolInput: Record<string, unknown>): ToolUseDecision {
  // Block destructive bash commands
  if (toolName === "Bash") {
    const cmd = String(toolInput.command ?? "");
    const dangerous = ["rm -rf", "drop table", "truncate", "format", "> /dev/"];
    if (dangerous.some((d) => cmd.toLowerCase().includes(d))) {
      return { allowed: false, reason: "Destructive command blocked" };
    }
  }

  // Block writing outside project directory
  if (toolName === "Write" || toolName === "Edit") {
    const path = String(toolInput.file_path ?? "");
    if (!path.startsWith("/app/") && !path.startsWith(process.cwd())) {
      return { allowed: false, reason: "Writes only allowed in project directory" };
    }
  }

  // Allow everything else
  return { allowed: true };
}

// Pattern 3: Audit logging
function auditPermissions(toolName: string, toolInput: Record<string, unknown>): ToolUseDecision {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT ${timestamp}] Tool: ${toolName}, Input: ${JSON.stringify(toolInput).slice(0, 200)}`);
  return undefined as unknown as ToolUseDecision; // Defer to permission mode
}

async function main() {
  // Strict: only allow read operations
  const q1 = query({
    prompt: "Analyze the codebase and find all TODO comments",
    options: {
      model: "sonnet",
      maxTurns: 10,
      canUseTool: allowlistPermissions,
    },
  });

  for await (const msg of q1) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }

  // Moderate: block dangerous patterns, allow the rest
  const q2 = query({
    prompt: "Refactor the auth module",
    options: {
      model: "sonnet",
      maxTurns: 20,
      permissionMode: "acceptEdits",
      canUseTool: blocklistPermissions,
    },
  });

  for await (const msg of q2) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }
}

main().catch(console.error);
