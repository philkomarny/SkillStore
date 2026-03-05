"use client";

import { useState, useEffect } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import InstallPanel from "@/components/InstallPanel";

interface SkillViewerProps {
  skillId: string;
  skillName: string;
  onClose: () => void;
}

export default function SkillViewer({
  skillId,
  skillName,
  onClose,
}: SkillViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [userSkill, setUserSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSkill() {
      setLoading(true);
      setError(null);
      setContent(null);
      setUserSkill(null);

      try {
        const res = await fetch(`/api/user-skills/${skillId}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || `Failed to load skill (${res.status})`);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setContent(data.content || "No content available.");
          setUserSkill(data.userSkill || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Network error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSkill();
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  return (
    <div className="rounded-xl border border-terminal-border bg-white overflow-hidden">
      {/* Header with close button */}
      <div className="px-5 py-4 border-b border-terminal-border flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-lg font-bold text-[#1a1a1a] truncate font-mono">
            {skillName}
          </h2>
          {userSkill?.version != null && (
            <span className="text-xs text-tertiary font-mono">
              v{userSkill.version}
            </span>
          )}
          {userSkill?.status === "refined" && (
            <span className="inline-flex items-center rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Refined
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-tertiary hover:text-muted hover:bg-terminal-surface transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-6 w-6 text-tertiary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Loaded: two-column layout matching marketplace */}
      {!loading && !error && content && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-5">
          {/* Main content — rendered markdown */}
          <div className="lg:col-span-2">
            {userSkill?.description && (
              <p className="text-muted mb-4">{userSkill.description}</p>
            )}

            <div className="prose-skill border-t border-terminal-border pt-6">
              <MarkdownRenderer content={content} />
            </div>
          </div>

          {/* Sidebar — install panel */}
          <div className="space-y-6">
            {/* Meta info */}
            <div className="rounded-xl border border-terminal-border bg-white p-5 space-y-4">
              {userSkill?.version != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Version</span>
                  <span className="text-sm font-mono text-[#1a1a1a]">
                    {userSkill.version}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Status</span>
                <span className="text-sm text-[#1a1a1a] capitalize">
                  {userSkill?.status || "draft"}
                </span>
              </div>
              {userSkill?.updated_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Updated</span>
                  <span className="text-sm text-[#1a1a1a] font-mono">
                    {new Date(userSkill.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Install panel — same as marketplace */}
            <InstallPanel
              skillName={userSkill?.skill_slug || skillName}
              skillSlug={userSkill?.skill_slug || skillName}
              rawContent={content}
              source=""
            />
          </div>
        </div>
      )}
    </div>
  );
}
