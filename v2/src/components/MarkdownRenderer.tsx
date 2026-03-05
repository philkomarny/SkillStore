"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

/** Strip YAML frontmatter (--- delimited) from the top of markdown content */
function stripFrontmatter(text: string): string {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("---", 3);
    if (end !== -1) {
      return trimmed.slice(end + 3).trimStart();
    }
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
