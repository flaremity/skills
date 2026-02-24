/**
 * Basic single-turn query example
 * @anthropic-ai/claude-agent-sdk@0.2.52
 */
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  const q = query({
    prompt: "Explain the difference between type and interface in TypeScript",
    options: {
      model: "sonnet",
      maxTurns: 3,
      systemPrompt: "You are a TypeScript expert. Be concise.",
    },
  });

  for await (const message of q) {
    switch (message.type) {
      case "assistant":
        process.stdout.write(message.content);
        break;
      case "tool_use":
        console.log(`\n[Tool: ${message.toolName}]`);
        break;
      case "error":
        console.error(`\nError: ${message.error}`);
        break;
    }
  }

  const result = await q.result;
  console.log("\n---");
  console.log(`Turns: ${result.numTurns}`);
  console.log(`Cost: $${result.totalCost.toFixed(4)}`);
  console.log(`Stop reason: ${result.stop_reason}`);
}

main().catch(console.error);
