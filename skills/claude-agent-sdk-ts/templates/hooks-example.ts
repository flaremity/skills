/**
 * Hook events — react to SDK lifecycle events
 * @anthropic-ai/claude-agent-sdk@0.2.79
 */
import { query } from "@anthropic-ai/claude-agent-sdk";

// Collect metrics
const metrics = {
  toolCalls: 0,
  toolDuration: new Map<string, number[]>(),
  notifications: [] as string[],
  permissionRequests: 0,
};

async function main() {
  const q = query({
    prompt: "Read the src/ directory and create a summary of the codebase",
    options: {
      model: "sonnet",
      maxTurns: 15,
      hooks: {
        PreToolUse: [
          {
            matcher: "*",
            handler: async (event) => {
              metrics.toolCalls++;
              console.log(`[Pre] ${event.toolName}`);

              // Block specific patterns
              if (event.toolName === "Bash") {
                const cmd = String(event.toolInput.command ?? "");
                if (cmd.includes("curl") || cmd.includes("wget")) {
                  return { proceed: false, reason: "Network access blocked" };
                }
              }

              return { proceed: true };
            },
          },
        ],

        PostToolUse: [
          {
            matcher: "*",
            handler: async (event) => {
              console.log(`[Post] ${event.toolName} (${event.duration}ms)`);

              // Track durations
              const durations = metrics.toolDuration.get(event.toolName) ?? [];
              durations.push(event.duration);
              metrics.toolDuration.set(event.toolName, durations);
            },
          },
        ],

        Notification: [
          {
            handler: async (event) => {
              console.log(`[Notification] ${event.message}`);
              metrics.notifications.push(event.message);
            },
          },
        ],

        Stop: [
          {
            handler: async (event) => {
              console.log(`[Stop] Reason: ${event.reason}`);
              // v0.2.50+: access last assistant message without parsing transcript
              if (event.last_assistant_message) {
                console.log(`[Stop] Last message: ${event.last_assistant_message.slice(0, 100)}`);
              }
              printMetrics();
            },
          },
        ],

        // v0.2.79+: React to agent stop failures
        StopFailure: [
          {
            handler: async (event) => {
              console.error(`[StopFailure] Error: ${event.error.message}`);
              if (event.error_details) {
                console.error(`  Details: ${event.error_details}`);
              }
              if (event.last_assistant_message) {
                console.error(`  Last message: ${event.last_assistant_message.slice(0, 200)}`);
              }
            },
          },
        ],

        // v0.2.50+: React to configuration changes
        ConfigChange: [
          {
            handler: async (event) => {
              console.log(`[ConfigChange] Source: ${event.source}, File: ${event.file_path ?? "N/A"}`);
            },
          },
        ],

        // v0.2.63+: React to MCP elicitation requests
        Elicitation: [
          {
            handler: async (event) => {
              console.log(
                `[Elicitation] Server: ${event.mcp_server_name}, Mode: ${event.mode ?? "form"}`
              );
              console.log(`  Message: ${event.message}`);
              if (event.url) {
                console.log(`  URL: ${event.url}`);
              }
              // Return action to accept, decline, or cancel
              // return { hookSpecificOutput: { hookEventName: 'Elicitation', action: 'accept', content: { name: 'Test' } } };
            },
          },
        ],

        // v0.2.63+: React to elicitation results
        ElicitationResult: [
          {
            handler: async (event) => {
              console.log(
                `[ElicitationResult] Server: ${event.mcp_server_name}, Action: ${event.action}`
              );
            },
          },
        ],

        // v0.2.70+: React to CLAUDE.md / memory file loading
        InstructionsLoaded: [
          {
            handler: async (event) => {
              console.log(
                `[InstructionsLoaded] File: ${event.file_path}, Type: ${event.memory_type}, Reason: ${event.load_reason}`
              );
              if (event.globs) {
                console.log(`  Globs: ${event.globs.join(", ")}`);
              }
              if (event.parent_file_path) {
                console.log(`  Parent: ${event.parent_file_path}`);
              }
            },
          },
        ],

        // v0.2.76+: React to context compaction
        PostCompact: [
          {
            handler: async (event) => {
              console.log(
                `[PostCompact] Trigger: ${event.trigger}, Summary length: ${event.compact_summary.length}`
              );
              console.log(`  Summary: ${event.compact_summary.slice(0, 200)}...`);
            },
          },
        ],

        // v0.2.50+: React to git worktree lifecycle
        WorktreeCreate: [
          {
            handler: async (event) => {
              console.log(`[WorktreeCreate] Name: ${event.name}`);
            },
          },
        ],

        WorktreeRemove: [
          {
            handler: async (event) => {
              console.log(`[WorktreeRemove] Path: ${event.worktree_path}`);
            },
          },
        ],
      },
    },
  });

  for await (const msg of q) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }

  await q.result;
}

function printMetrics() {
  console.log("\n=== Metrics ===");
  console.log(`Total tool calls: ${metrics.toolCalls}`);

  for (const [tool, durations] of metrics.toolDuration) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    console.log(`  ${tool}: ${durations.length} calls, avg ${avg.toFixed(0)}ms`);
  }

  if (metrics.notifications.length > 0) {
    console.log(`Notifications: ${metrics.notifications.length}`);
  }
}

main().catch(console.error);
