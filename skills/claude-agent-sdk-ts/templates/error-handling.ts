/**
 * Comprehensive error handling patterns
 * @anthropic-ai/claude-agent-sdk@0.2.59
 */
import { query } from "@anthropic-ai/claude-agent-sdk";

async function withRetry(
  promptText: string,
  maxRetries = 3,
): Promise<{ success: boolean; cost: number }> {
  let totalCost = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxRetries}`);
    let q: ReturnType<typeof query> | undefined;

    try {
      q = query({
        prompt: promptText,
        options: {
          model: "sonnet",
          maxTurns: 10,
          enableFileCheckpointing: true,
        },
      });

      let hasError = false;

      for await (const msg of q) {
        switch (msg.type) {
          case "assistant":
            process.stdout.write(msg.content);
            break;

          case "error":
            console.error(`\n[Error ${msg.code ?? "unknown"}]: ${msg.error}`);
            hasError = true;
            break;

          case "tool_result":
            if (msg.content.includes("Error:")) {
              console.warn(`\n[Tool warning]: ${msg.content.slice(0, 200)}`);
            }
            break;
        }
      }

      const result = await q.result;
      totalCost += result.totalCost;

      if (result.stop_reason === "error" || hasError) {
        console.log(`\nQuery ended with errors. Rewinding files...`);
        q.rewindFiles();
        continue;
      }

      console.log(`\nSuccess on attempt ${attempt}. Cost: $${totalCost.toFixed(4)}`);
      return { success: true, cost: totalCost };

    } catch (error) {
      if (error instanceof Error) {
        console.error(`\nFatal error: ${error.message}`);

        // Rewind on failure
        if (q) {
          try { q.rewindFiles(); } catch { /* ignore */ }
        }

        // Don't retry on auth errors
        if (error.message.includes("auth") || error.message.includes("API key")) {
          throw error;
        }
      }
    } finally {
      q?.close();
    }
  }

  console.error(`\nFailed after ${maxRetries} attempts. Total cost: $${totalCost.toFixed(4)}`);
  return { success: false, cost: totalCost };
}

// Timeout wrapper
async function withTimeout(promptText: string, timeoutMs: number) {
  const q = query({
    prompt: promptText,
    options: { model: "haiku", maxTurns: 5 },
  });

  const timeout = setTimeout(() => {
    console.log("\nTimeout reached, interrupting...");
    q.interrupt();
  }, timeoutMs);

  try {
    for await (const msg of q) {
      if (msg.type === "assistant") process.stdout.write(msg.content);
    }
    const result = await q.result;
    console.log(`\nStop reason: ${result.stop_reason}`);
  } finally {
    clearTimeout(timeout);
    q.close();
  }
}

async function main() {
  // Retry pattern
  const result = await withRetry("Fix the failing tests in src/");
  console.log(`Final result: ${result.success ? "SUCCESS" : "FAILED"}`);

  // Timeout pattern
  await withTimeout("Analyze codebase performance", 30_000);
}

main().catch(console.error);
