"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

interface InstallPanelProps {
  skillName: string;
  rawContent: string;
  source: string;
  contextContent?: string | null;
  repoOwner?: string;
  repoName?: string;
  repoBranch?: string;
}

type Tab = "desktop" | "code" | "project";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "desktop", label: "Desktop & Web", icon: "desktop" },
  { id: "code", label: "Claude Code", icon: "terminal" },
  { id: "project", label: "Project File", icon: "folder" },
];

const CONTEXT_SEPARATOR =
  "\n\n---\n\n## Your Context\n\nThe following context personalizes this skill for your specific needs.\n\n";

export default function InstallPanel({
  skillName,
  rawContent,
  source,
  contextContent,
  repoOwner = "philkomarny",
  repoName = "SkillStore",
  repoBranch = "main",
}: InstallPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("desktop");

  const commandFilePath = `.claude/commands/${skillName}.md`;
  const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${repoBranch}/${source}`;
  const curlCommand = `curl -sL "${rawUrl}" > ${commandFilePath}`;
  const combinedContent = contextContent
    ? rawContent + CONTEXT_SEPARATOR + contextContent
    : rawContent;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <h2 className="text-sm font-semibold text-gray-900 px-5 pt-5 pb-3">
        Add to Claude
      </h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <TabIcon type={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === "desktop" && (
          <div>
            <p className="text-xs text-gray-500 mb-4">
              Works in the <strong>Claude Desktop app</strong> (macOS/Windows) and{" "}
              <strong>claude.ai</strong> in the browser.
            </p>

            <ol className="text-xs text-gray-600 space-y-3 mb-4">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Open <strong>Claude Desktop</strong> or <strong>claude.ai</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Create or open a <strong>Project</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Open <strong>Project settings</strong> and find <strong>Custom instructions</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">4</span>
                <span>Paste the skill content (copied below)</span>
              </li>
            </ol>

            {contextContent ? (
              <div className="space-y-2 mb-4">
                <CopyButton text={combinedContent} label="Copy skill + context" />
                <CopyButton text={rawContent} label="Copy skill only" />
              </div>
            ) : (
              <CopyButton text={rawContent} label="Copy skill to clipboard" />
            )}
          </div>
        )}

        {activeTab === "code" && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Add as a <strong>slash command</strong> in Claude Code:
            </p>
            <div className="bg-gray-900 rounded-lg p-3 mb-3">
              <code className="text-xs font-mono text-green-400 break-all">
                mkdir -p .claude/commands && {curlCommand}
              </code>
            </div>
            <CopyButton
              text={`mkdir -p .claude/commands && ${curlCommand}`}
              label="Copy command"
            />

            <div className="bg-blue-50 rounded-lg p-3 mt-4">
              <p className="text-[11px] text-blue-700">
                Once added, invoke with{" "}
                <code className="font-mono font-semibold">/{skillName}</code>{" "}
                in Claude Code.
              </p>
            </div>
          </div>
        )}

        {activeTab === "project" && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Copy and save as a project file:
            </p>

            <p className="text-xs text-gray-500 mb-2">
              Save as{" "}
              <code className="bg-gray-100 px-1 rounded text-[11px]">
                {commandFilePath}
              </code>
            </p>

            {contextContent ? (
              <div className="space-y-2">
                <CopyButton text={combinedContent} label="Copy skill + context" />
                <CopyButton text={rawContent} label="Copy skill only" />
              </div>
            ) : (
              <CopyButton text={rawContent} label="Copy skill content" />
            )}

            <div className="bg-blue-50 rounded-lg p-3 mt-4">
              <p className="text-[11px] text-blue-700">
                Once saved, invoke with{" "}
                <code className="font-mono font-semibold">/{skillName}</code>{" "}
                in Claude Code. Scoped to this project only.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabIcon({ type }: { type: string }) {
  if (type === "terminal") {
    return (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === "folder") {
    return (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  }
  // desktop
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
