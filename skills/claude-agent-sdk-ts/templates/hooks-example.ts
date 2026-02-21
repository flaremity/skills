/**
 * Hook events — react to SDK lifecycle events
 * @anthropic-ai/claude-agent-sdk@0.2.50
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
              printMetrics();
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
