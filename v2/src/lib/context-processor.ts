import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

/**
 * Claude's API limit is 5MB per image (base64-encoded).
 * Base64 adds ~33% overhead, so raw image must be under ~3.5MB.
 * We compress to JPEG and resize large images to stay well within limits.
 */
const MAX_IMAGE_BYTES = 3_500_000; // 3.5MB raw → ~4.7MB base64 (under 5MB limit)

async function compressImageForClaude(
  buffer: Buffer,
  mimeType: string
): Promise<{ data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }> {
  // First, try the original image if it's small enough
  if (buffer.length <= MAX_IMAGE_BYTES) {
    return {
      data: buffer.toString("base64"),
      mediaType: mimeType as "image/jpeg" | "image/png" | "image/webp",
    };
  }

  // Image too large — resize and compress to JPEG
  console.log(`Compressing image: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → targeting <3.5MB`);

  let quality = 85;
  let width = 2048; // max dimension

  // Try progressively smaller sizes/qualities until under limit
  for (let attempt = 0; attempt < 4; attempt++) {
    const compressed = await sharp(buffer)
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (compressed.length <= MAX_IMAGE_BYTES) {
      console.log(`Compressed to ${(compressed.length / 1024 / 1024).toFixed(1)}MB (${width}px, q${quality})`);
      return {
        data: compressed.toString("base64"),
        mediaType: "image/jpeg",
      };
    }

    // Reduce for next attempt
    width = Math.round(width * 0.7);
    quality = Math.max(50, quality - 10);
  }

  // Final fallback: aggressive compression
  const final = await sharp(buffer)
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 40, mozjpeg: true })
    .toBuffer();

  console.log(`Final compress: ${(final.length / 1024 / 1024).toFixed(1)}MB (1024px, q40)`);
  return {
    data: final.toString("base64"),
    mediaType: "image/jpeg",
  };
}

/**
 * Extract text from various file types.
 * PDFs and images are NOT handled here — they're sent directly to Claude
 * as document/image content blocks for much better extraction.
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

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // PDFs and images return empty — they'll be sent to Claude directly
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "";
  }
  if (mimeType.startsWith("image/")) {
    return "";
  }

  return buffer.toString("utf-8");
}

/**
 * Compress an image buffer for Claude API if needed.
 * Exported so route handlers can call it when building processedFiles.
 */
export { compressImageForClaude };

/**
 * Build content blocks for files to send to Claude.
 * PDFs are sent as document blocks, images as image blocks, text inline.
 * Images should already be compressed via compressImageForClaude() before
 * being passed here — the base64 and mimeType in the file object are used as-is.
 */
function buildFileContentBlocks(
  files: Array<{ name: string; text: string; mimeType: string; base64?: string }>
): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const file of files) {
    if (file.base64 && file.mimeType === "application/pdf") {
      // Send PDF directly to Claude as a document block
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: file.base64,
        },
      } as any);
      blocks.push({
        type: "text",
        text: `[PDF document: ${file.name}]`,
      });
    } else if (file.base64 && file.mimeType.startsWith("image/")) {
      // Send image to Claude Vision (already compressed by caller)
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: file.base64,
        },
      });
      blocks.push({
        type: "text",
        text: `[Image file: ${file.name}]`,
      });
    } else if (file.text) {
      blocks.push({
        type: "text",
        text: `\n---\nFile: ${file.name}\n\n${file.text.slice(0, 50000)}\n---\n`,
      });
    }
  }

  return blocks;
}

/**
 * Process uploaded files with Claude API to generate a reusable context profile.
 * This context is standalone — not tied to any specific skill — so it can
 * be applied to any skill during refinement.
 */
export async function generateContext(
  profileName: string,
  files: Array<{ name: string; text: string; mimeType: string; base64?: string }>
): Promise<string> {
  const contentBlocks: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `You are helping a higher education professional build a reusable context profile from their documents.

The context profile is named: "${profileName}"

Analyze the uploaded documents and generate a comprehensive context profile as clean markdown. This context will later be combined with various AI skill templates to personalize them, so extract ALL relevant information including:

- Organization/institution details (name, mission, values, type, size)
- Brand voice and tone guidelines
- Specific terminology, acronyms, and nomenclature
- Key data points, metrics, statistics, and dates
- Processes, workflows, and standard procedures
- Target audiences and stakeholders
- Key people, departments, teams, and their roles
- Communication styles and preferences
- Goals, priorities, and strategic initiatives
- Compliance requirements and policies

Format the output as clean markdown with clear, labeled sections. Be specific and actionable — include actual names, values, and details from the documents, not generic placeholders. The more specific detail you capture, the better the skill refinements will be.

Here are the uploaded documents:`,
    },
    ...buildFileContentBlocks(files),
  ];

  const response = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: contentBlocks }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "# Context\n\nNo context could be generated from the uploaded files.";
}

/**
 * Refine a skill using pre-built context markdown.
 * This is the core Refinery operation — takes the original skill content
 * and a pre-built context profile (not raw files), returns a fully rewritten skill.
 *
 * Much simpler than the old refineSkill() because all file processing
 * happened during context profile creation. No downloads or compression needed.
 */
export async function refineSkillWithContext(
  originalSkillContent: string,
  skillName: string,
  contextMarkdown: string
): Promise<{ refinedContent: string; contextSummary: string }> {
  const contentBlocks: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `You are the eduSkillsMP Refinery — a skill refinement engine for higher education professionals.

You will receive:
1. An original Claude skill file (markdown with instructions for Claude)
2. A context profile containing the user's institutional information

Your job is to REWRITE the skill file so that the user's specific context is baked directly into the instructions. This is NOT about appending context — it's about rewriting every relevant section so the skill speaks in the user's language, references their institution, uses their data, and follows their processes.

Rules:
- Preserve the skill's overall structure, purpose, and markdown formatting
- Replace generic references with specific ones from the context profile
- Incorporate the user's terminology, acronyms, department names, and processes
- Include specific data points, metrics, names, and details found in the context
- Keep the skill functional as a Claude instruction file — it must still work when used
- If the context doesn't contain relevant info for a section, leave it mostly unchanged
- Do NOT add a separate "context" or "appendix" section — weave the context INTO the instructions

After the rewritten skill, add a separator and provide a brief context summary (3-5 bullet points) of the key details you incorporated.

Format your response EXACTLY like this:
---REFINED_SKILL_START---
[The complete rewritten skill markdown]
---REFINED_SKILL_END---
---CONTEXT_SUMMARY_START---
[3-5 bullet points summarizing key context incorporated]
---CONTEXT_SUMMARY_END---`,
    },
    {
      type: "text",
      text: `\n\n## Original Skill: "${skillName}"\n\n\`\`\`markdown\n${originalSkillContent}\n\`\`\``,
    },
    {
      type: "text",
      text: `\n\n## User's Context Profile:\n\n${contextMarkdown}`,
    },
  ];

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
