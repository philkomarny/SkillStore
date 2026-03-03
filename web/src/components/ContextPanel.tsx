"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

interface ContextPanelProps {
  content: string;
}

const PREVIEW_LINES = 10;

export default function ContextPanel({ content }: ContextPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = content.split("\n");
  const needsTruncation = lines.length > PREVIEW_LINES;
  const displayContent = expanded
    ? content
    : lines.slice(0, PREVIEW_LINES).join("\n") +
      (needsTruncation ? "\n..." : "");

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-blue-900">
          Institution Context
        </h2>
        <span className="text-[10px] bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          context.md
        </span>
      </div>

      <div className="px-5 pb-2">
        <p className="text-[11px] text-blue-700 mb-3">
          This skill includes institution-specific context that enhances the
          generic skill with your data, voice, and preferences.
        </p>
        <div className="bg-white rounded-lg border border-blue-200 p-3 mb-3">
          <pre className="text-[11px] font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </pre>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton text={content} label="Copy context" />
          {needsTruncation && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              {expanded ? "Show less" : `Show all ${lines.length} lines`}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-4 pt-1">
        <p className="text-[10px] text-blue-600">
          Context files are version-controlled in your fork and deployed with
          your private catalog.
        </p>
      </div>
    </div>
  );
}
