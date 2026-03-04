import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

/**
 * Extract text from various file types.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".txt")
  ) {
    return buffer.toString("utf-8");
  }

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse" as any)).default || (await import("pdf-parse" as any));
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // For images, return empty — they'll be sent to Claude Vision directly
  if (mimeType.startsWith("image/")) {
    return "";
  }

  return buffer.toString("utf-8");
}

/**
 * Process uploaded files with Claude API to generate context.md.
 */
export async function generateContext(
  skillDescription: string,
  files: Array<{ name: string; text: string; mimeType: string; base64?: string }>
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [];

  // Build the content blocks
  const contentBlocks: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `You are helping a user personalize a Claude skill for their specific needs.

The skill is: ${skillDescription}

The user has uploaded the following documents. Analyze them and generate a context.md file that personalizes this skill. Extract key information such as:
- Organization/institution details (name, mission, values)
- Brand voice and tone guidelines
- Specific terminology and nomenclature
- Relevant data points, metrics, or statistics
- Processes, workflows, and preferences
- Target audiences and stakeholders
- Key people, departments, or teams

Format the output as clean markdown with clear sections. Be specific and actionable — include actual names, values, and details from the documents, not generic placeholders.

Here are the uploaded files:`,
    },
  ];

  for (const file of files) {
    if (file.base64 && file.mimeType.startsWith("image/")) {
      // Send image to Claude Vision
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: file.base64,
        },
      });
      contentBlocks.push({
        type: "text",
        text: `[Image file: ${file.name}]`,
      });
    } else if (file.text) {
      contentBlocks.push({
        type: "text",
        text: `\n---\nFile: ${file.name}\n\n${file.text.slice(0, 50000)}\n---\n`,
      });
    }
  }

  messages.push({ role: "user", content: contentBlocks });

  const response = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "# Context\n\nNo context could be generated from the uploaded files.";
}

/**
 * Refine a skill by rewriting it with the user's context baked in.
 * This is the core Refinery operation — takes the original skill content
 * and user-uploaded documents, returns a fully rewritten skill file.
 */
export async function refineSkill(
  originalSkillContent: string,
  skillName: string,
  files: Array<{ name: string; text: string; mimeType: string; base64?: string }>
): Promise<{ refinedContent: string; contextSummary: string }> {
  const contentBlocks: Anthropic.ContentBlockParam[] = [];

  // System-level instruction as the first text block
  contentBlocks.push({
    type: "text",
    text: `You are the eduSkillsMP Refinery — a skill refinement engine for higher education professionals.

You will receive:
1. An original Claude skill file (markdown with instructions for Claude)
2. One or more documents uploaded by the user (their institutional context)

Your job is to REWRITE the skill file so that the user's specific context is baked directly into the instructions. This is NOT about appending context — it's about rewriting every relevant section so the skill speaks in the user's language, references their institution, uses their data, and follows their processes.

Rules:
- Preserve the skill's overall structure, purpose, and markdown formatting
- Replace generic references with specific ones from the user's documents
- Incorporate the user's terminology, acronyms, department names, and processes
- Include specific data points, metrics, names, and details found in their documents
- Keep the skill functional as a Claude instruction file — it must still work when used
- If the user's documents don't contain relevant info for a section, leave it mostly unchanged
- Do NOT add a separate "context" or "appendix" section — weave the context INTO the instructions

After the rewritten skill, add a separator and provide a brief context summary (3-5 bullet points) of the key details you incorporated.

Format your response EXACTLY like this:
---REFINED_SKILL_START---
[The complete rewritten skill markdown]
---REFINED_SKILL_END---
---CONTEXT_SUMMARY_START---
[3-5 bullet points summarizing key context incorporated]
---CONTEXT_SUMMARY_END---`,
  });

  contentBlocks.push({
    type: "text",
    text: `\n\n## Original Skill: "${skillName}"\n\n\`\`\`markdown\n${originalSkillContent}\n\`\`\``,
  });

  contentBlocks.push({
    type: "text",
    text: `\n\n## User's Documents:\n`,
  });

  for (const file of files) {
    if (file.base64 && file.mimeType.startsWith("image/")) {
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: file.base64,
        },
      });
      contentBlocks.push({
        type: "text",
        text: `[Image file: ${file.name}]`,
      });
    } else if (file.text) {
      contentBlocks.push({
        type: "text",
        text: `\n---\nFile: ${file.name}\n\n${file.text.slice(0, 50000)}\n---\n`,
      });
    }
  }

  const response = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: contentBlocks }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const fullResponse = textBlock?.text || "";

  // Parse the structured response
  let refinedContent = originalSkillContent;
  let contextSummary = "Skill refined with user context.";

  const skillMatch = fullResponse.match(
    /---REFINED_SKILL_START---\s*([\s\S]*?)\s*---REFINED_SKILL_END---/
  );
  if (skillMatch) {
    refinedContent = skillMatch[1].trim();
  } else {
    // Fallback: if the model didn't follow the format, use the full response
    refinedContent = fullResponse;
  }

  const summaryMatch = fullResponse.match(
    /---CONTEXT_SUMMARY_START---\s*([\s\S]*?)\s*---CONTEXT_SUMMARY_END---/
  );
  if (summaryMatch) {
    contextSummary = summaryMatch[1].trim();
  }

  return { refinedContent, contextSummary };
}
