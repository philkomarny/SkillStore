"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import CopyButton from "./CopyButton";

interface InstallPanelProps {
  skillName: string;
  skillSlug: string;
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
  skillSlug,
  rawContent,
  source,
  contextContent,
  repoOwner = "philkomarny",
  repoName = "SkillStore",
  repoBranch = "main",
}: InstallPanelProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("desktop");
  const ipRef = useRef<string>("unknown");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => { ipRef.current = d.ip; })
      .catch(() => {});
  }, []);

  const trackDownload = () => {
    window.dispatchEvent(new CustomEvent("skill-downloaded"));
    fetch("https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: skillSlug,
        count: 1,
        count_type: "download",
        user_id: session?.user?.id ?? null,
        ip_address: ipRef.current,
      }),
    })
      .then((r) => console.log("[download] post status:", r.status))
      .catch((err) => console.error("[download] post failed:", err));
  };

  const commandFilePath = `.claude/commands/${skillName}.md`;
  const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${repoBranch}/${source}`;
  const curlCommand = `curl -sL "${rawUrl}" > ${commandFilePath}`;
  const combinedContent = contextContent
    ? rawContent + CONTEXT_SEPARATOR + contextContent
    : rawContent;

  return (
    <div className="rounded-xl border border-terminal-border bg-white overflow-hidden">
      <h2 className="text-sm font-semibold text-[#1a1a1a] px-5 pt-5 pb-3">
        Add to Claude
      </h2>

      {/* Tabs */}
      <div className="flex border-b border-terminal-border px-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-[#1a1a1a]"
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
            <p className="text-xs text-muted mb-4">
              Works in the <strong>Claude Desktop app</strong> (macOS/Windows) and{" "}
              <strong>claude.ai</strong> in the browser.
            </p>

            <ol className="text-xs text-muted space-y-3 mb-4">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Open <strong>Claude Desktop</strong> or <strong>claude.ai</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Create or open a <strong>Project</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Open <strong>Project settings</strong> and find <strong>Custom instructions</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">4</span>
                <span>Paste the skill content (copied below)</span>
              </li>
            </ol>

            {contextContent ? (
              <div className="space-y-2 mb-4">
                <CopyButton text={combinedContent} label="Copy skill + context" onCopy={trackDownload} />
                <CopyButton text={rawContent} label="Copy skill only" onCopy={trackDownload} />
              </div>
            ) : (
              <CopyButton text={rawContent} label="Copy skill to clipboard" onCopy={trackDownload} />
            )}
          </div>
        )}

        {activeTab === "code" && (
          <div>
            <p className="text-xs text-muted mb-3">
              Add as a <strong>slash command</strong> in Claude Code:
            </p>
            <div className="bg-terminal-dark rounded-lg p-3 mb-3">
              <code className="text-xs font-mono text-success break-all">
                mkdir -p .claude/commands && {curlCommand}
              </code>
            </div>
            <CopyButton
              text={`mkdir -p .claude/commands && ${curlCommand}`}
              label="Copy command"
              onCopy={trackDownload}
            />

            <div className="bg-terminal-surface rounded-lg p-3 mt-4">
              <p className="text-[11px] text-muted">
                Once added, invoke with{" "}
                <code className="font-mono font-semibold text-accent">/{skillName}</code>{" "}
                in Claude Code.
              </p>
            </div>
          </div>
        )}

        {activeTab === "project" && (
          <div>
            <p className="text-xs text-muted mb-3">
              Download and save to your project:
            </p>

            <p className="text-xs text-muted mb-3">
              Save to{" "}
              <code className="bg-terminal-surface px-1 rounded text-[11px] font-mono">
                {commandFilePath}
              </code>{" "}
              in your project root.
            </p>

            <div className="space-y-2 mb-2">
              <DownloadButton
                content={contextContent ? combinedContent : rawContent}
                filename={`${skillName}.md`}
                label={contextContent ? "Download skill + context" : "Download skill file"}
                onDownload={trackDownload}
              />
              {contextContent && (
                <DownloadButton
                  content={rawContent}
                  filename={`${skillName}.md`}
                  label="Download skill only"
                  onDownload={trackDownload}
                />
              )}
            </div>

            <div className="bg-terminal-surface rounded-lg p-3 mt-4">
              <p className="text-[11px] text-muted">
                Move the downloaded file to{" "}
                <code className="font-mono font-semibold text-accent">.claude/commands/</code>{" "}
                in your project root, then invoke with{" "}
                <code className="font-mono font-semibold text-accent">/{skillName}</code>{" "}
                in Claude Code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadButton({
  content,
  filename,
  label,
  onDownload,
}: {
  content: string;
  filename: string;
  label: string;
  onDownload: () => void;
}) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onDownload();
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg border border-terminal-border bg-white hover:bg-terminal-surface transition-colors text-[#1a1a1a]"
    >
      <svg className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </button>
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
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
