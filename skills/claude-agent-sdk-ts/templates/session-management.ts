/**
 * Session management — V1 resume + V2 multi-turn
 * @anthropic-ai/claude-agent-sdk@0.2.52
 */
import {
  query,
  unstable_v2_createSession,
  unstable_v2_resumeSession,
} from "@anthropic-ai/claude-agent-sdk";

// V1: Resume a session
async function v1SessionResume() {
  const options = { model: "sonnet" as const, maxTurns: 5 };

  // First query
  const q1 = query({ prompt: "Create a Node.js CLI tool skeleton", options });
  for await (const msg of q1) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }
  const result1 = await q1.result;

  // Resume with follow-up
  const q2 = query({
    prompt: "Add a --help flag to the CLI",
    options: {
      ...options,
      resume: { sessionId: result1.sessionId, transcript: [] },
    },
  });
  for await (const msg of q2) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }
  const result2 = await q2.result;
  console.log(`\nTotal cost: $${(result1.totalCost + result2.totalCost).toFixed(4)}`);
}

// V2: Multi-turn session
async function v2MultiTurn() {
  await using session = unstable_v2_createSession({
    options: {
      model: "sonnet",
      systemPrompt: "You are a helpful coding assistant.",
      maxTurns: 10,
    },
  });

  // Turn 1
  console.log("--- Turn 1 ---");
  for await (const msg of session.stream("Create a REST API with Express")) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }

  // Turn 2
  console.log("\n--- Turn 2 ---");
  for await (const msg of session.stream("Add JWT authentication")) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }

  // Save session ID for later resumption
  const sessionId = session.sessionId;
  console.log(`\nSession ID: ${sessionId}`);
}

// V2: Resume existing session
async function v2Resume(sessionId: string) {
  await using session = unstable_v2_resumeSession(sessionId, {
    options: { model: "sonnet", maxTurns: 10 },
  });

  for await (const msg of session.stream("Add rate limiting middleware")) {
    if (msg.type === "assistant") process.stdout.write(msg.content);
  }
}

// Run examples
async function main() {
  console.log("=== V1 Session Resume ===\n");
  await v1SessionResume();

  console.log("\n\n=== V2 Multi-Turn ===\n");
  await v2MultiTurn();
}

main().catch(console.error);
