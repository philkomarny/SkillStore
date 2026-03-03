"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

interface InstallPanelProps {
  skillName: string;
  rawContent: string;
  source: string;
}

type Tab = "desktop" | "code" | "project";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "desktop", label: "Desktop & Web", icon: "desktop" },
  { id: "code", label: "Claude Code", icon: "terminal" },
  { id: "project", label: "Project File", icon: "folder" },
];

export default function InstallPanel({
  skillName,
  rawContent,
  source,
}: InstallPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("desktop");

  const cliCommand = `plugin install ${skillName}@skillstore`;
  const commandFilePath = `.claude/commands/${skillName}.md`;
  const rawUrl = `https://raw.githubusercontent.com/philkomarny/SkillStore/main/${source}`;
  const curlCommand = `curl -sL "${rawUrl}" > ${commandFilePath}`;

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
              <strong>claude.ai</strong> in the browser — same steps for both.
            </p>

            <ol className="text-xs text-gray-600 space-y-3 mb-4">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>
                  Open <strong>Claude Desktop</strong> or{" "}
                  <a
                    href="https://claude.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    claude.ai
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Create or open a <strong>Project</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>
                  Open <strong>Project settings</strong> and find{" "}
                  <strong>Custom instructions</strong>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">4</span>
                <span>Paste the skill content (copied below)</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">5</span>
                <span>
                  Save — the skill is active for all chats in that Project
                </span>
              </li>
            </ol>

            <CopyButton text={rawContent} label="Copy skill to clipboard" />

            <div className="bg-blue-50 rounded-lg p-3 mt-4">
              <p className="text-[11px] text-blue-800 font-medium mb-1">
                Where it works
              </p>
              <div className="flex gap-3 text-[11px] text-blue-700">
                <span className="flex items-center gap-1">
                  <TabIcon type="desktop" />
                  Claude Desktop
                </span>
                <span className="flex items-center gap-1">
                  <TabIcon type="globe" />
                  claude.ai
                </span>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 mt-2">
              <p className="text-[11px] text-amber-700">
                Tip: Add to your <strong>account-level</strong> custom instructions
                instead of a Project to make the skill available in every conversation.
              </p>
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Run in the <strong>Claude Code CLI</strong> to install as a plugin:
            </p>
            <div className="bg-gray-900 rounded-lg p-3 mb-3">
              <code className="text-xs font-mono text-green-400 break-all">
                {cliCommand}
              </code>
            </div>
            <CopyButton text={cliCommand} label="Copy command" />

            <div className="bg-blue-50 rounded-lg p-3 mt-4">
              <p className="text-[11px] text-blue-700">
                This installs the skill globally in Claude Code.
                It will be available in all your CLI sessions.
              </p>
            </div>
          </div>
        )}

        {activeTab === "project" && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Add as a <strong>slash command</strong> in a Claude Code project:
            </p>

            {/* Option 1: curl */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-1.5">
                Option 1 — Download directly
              </p>
              <div className="bg-gray-900 rounded-lg p-3 mb-2">
                <code className="text-[11px] font-mono text-green-400 break-all leading-relaxed">
                  mkdir -p .claude/commands && \<br />
                  {curlCommand}
                </code>
              </div>
              <CopyButton
                text={`mkdir -p .claude/commands && ${curlCommand}`}
                label="Copy command"
              />
            </div>

            <div className="border-t border-gray-100 pt-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1.5">
                Option 2 — Copy to clipboard
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Copy the skill content, then save as{" "}
                <code className="bg-gray-100 px-1 rounded text-[11px]">
                  {commandFilePath}
                </code>
              </p>
              <CopyButton text={rawContent} label="Copy skill content" />
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mt-3">
              <p className="text-[11px] text-blue-700">
                Once added, invoke with{" "}
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }
  if (type === "folder") {
    return (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    );
  }
  if (type === "desktop") {
    return (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  }
  // globe
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}
