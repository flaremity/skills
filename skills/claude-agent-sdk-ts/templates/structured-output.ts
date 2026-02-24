/**
 * Structured output — JSON responses with Zod schemas
 * @anthropic-ai/claude-agent-sdk@0.2.51
 */
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Define output schema
const CodeReviewSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    issues: z.array(z.object({
      line: z.number(),
      severity: z.enum(["info", "warning", "error", "critical"]),
      category: z.enum(["bug", "security", "performance", "style", "maintainability"]),
      message: z.string(),
      suggestion: z.string().optional(),
    })),
  })),
  summary: z.object({
    totalIssues: z.number(),
    criticalCount: z.number(),
    overallScore: z.number().min(0).max(10),
    recommendation: z.string(),
  }),
});

type CodeReview = z.infer<typeof CodeReviewSchema>;

async function reviewCode(filePaths: string[]): Promise<CodeReview> {
  const q = query({
    prompt: `Review these files for issues: ${filePaths.join(", ")}`,
    options: {
      model: "sonnet",
      maxTurns: 5,
      outputFormat: {
        type: "json",
        schema: CodeReviewSchema,
      },
      systemPrompt: "You are a code reviewer. Analyze files and return structured findings.",
    },
  });

  let resultContent = "";
  for await (const msg of q) {
    if (msg.type === "result") {
      resultContent = msg.content;
    }
  }

  return CodeReviewSchema.parse(JSON.parse(resultContent));
}

async function main() {
  const review = await reviewCode(["src/auth.ts", "src/api.ts"]);

  console.log(`Overall Score: ${review.summary.overallScore}/10`);
  console.log(`Total Issues: ${review.summary.totalIssues}`);
  console.log(`Critical: ${review.summary.criticalCount}`);
  console.log(`Recommendation: ${review.summary.recommendation}`);

  for (const file of review.files) {
    console.log(`\n--- ${file.path} ---`);
    for (const issue of file.issues) {
      console.log(`  L${issue.line} [${issue.severity}] ${issue.message}`);
    }
  }
}

main().catch(console.error);
