/**
 * Multi-agent workflow — orchestrate subagents
 * @anthropic-ai/claude-agent-sdk@0.2.56
 */
import { query, tool, type AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Custom tool for the researcher agent
const searchTool = tool({
  name: "web_search",
  description: "Search the web for information",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  async execute(input) {
    // Replace with real search implementation
    return { content: `Search results for: ${input.query}` };
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
});

// Define specialized agents
const agents: AgentDefinition[] = [
  {
    name: "researcher",
    description: "Researches topics using web search and summarizes findings",
    model: "haiku",
    permissionMode: "bypassPermissions",
    tools: [searchTool],
    systemPrompt: "You research topics thoroughly. Always cite sources.",
    maxTurns: 10,
  },
  {
    name: "coder",
    description: "Implements TypeScript code based on specifications",
    model: "sonnet",
    permissionMode: "acceptEdits",
    systemPrompt: "Write clean, tested TypeScript. Follow existing patterns.",
    maxTurns: 20,
  },
  {
    name: "reviewer",
    description: "Reviews code for bugs, security issues, and best practices",
    model: "sonnet",
    permissionMode: "plan", // Read-only
    systemPrompt: "Review code carefully. Focus on bugs, security, and performance.",
    maxTurns: 5,
  },
];

async function main() {
  const q = query({
    prompt: `
      1. Research best practices for building a rate limiter in TypeScript
      2. Implement a token bucket rate limiter
      3. Review the implementation for correctness
    `,
    options: {
      model: "opus",
      subagents: agents,
      maxTurns: 50,
      systemPrompt: "You are an orchestrator. Delegate tasks to your subagents.",
    },
  });

  for await (const message of q) {
    switch (message.type) {
      case "assistant":
        process.stdout.write(message.content);
        break;
      case "tool_use":
        console.log(`\n[Agent/Tool: ${message.toolName}]`);
        break;
    }
  }

  const result = await q.result;
  console.log(`\nTotal cost: $${result.totalCost.toFixed(4)}`);
  console.log(`Total turns: ${result.numTurns}`);
}

main().catch(console.error);
