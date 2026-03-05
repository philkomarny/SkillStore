"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

/** Strip YAML frontmatter from the top of markdown content.
 *  Handles both standard `---` delimited frontmatter and bare
 *  `name:` / `description:` / `metadata:` blocks that appear
 *  before the first markdown heading. */
function stripFrontmatter(text: string): string {
  const trimmed = text.trimStart();

  // Standard --- delimited frontmatter
  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("---", 3);
    if (end !== -1) {
      return trimmed.slice(end + 3).trimStart();
    }
  }

  // Bare frontmatter: lines starting with known YAML keys before the first heading
  if (/^(name|description|metadata|tags|category|version)\s*:/i.test(trimmed)) {
    const lines = trimmed.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      // Stop when we hit an empty line followed by a heading, or a heading directly
      if (line.startsWith("#")) break;
      if (line === "" && i + 1 < lines.length && lines[i + 1].trim().startsWith("#")) {
        i++; // skip the blank line
        break;
      }
      // Stop if the line doesn't look like frontmatter (key: value, continuation, or blank)
      if (line !== "" && !/^[\w-]+\s*:/.test(line) && !line.startsWith("[") && !line.startsWith("-")) {
        break;
      }
      i++;
    }
    return lines.slice(i).join("\n").trimStart();
  }

  return text;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-skill">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {stripFrontmatter(content)}
      </ReactMarkdown>
    </div>
  );
}
