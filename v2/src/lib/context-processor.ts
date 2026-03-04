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
