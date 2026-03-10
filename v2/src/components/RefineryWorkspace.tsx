"use client";

import { useState } from "react";

interface RefineryWorkspaceProps {
  skills: any[];
  contextProfiles: any[];
  selectedSkillId: string | null;
  selectedContextId: string | null;
  onProfilesChanged: () => void;
  userName: string;
}

export default function RefineryWorkspace({
  skills,
  contextProfiles,
  selectedSkillId,
  selectedContextId,
  onProfilesChanged,
  userName,
}: RefineryWorkspaceProps) {
  const [refining, setRefining] = useState(false);
  const [refineResult, setRefineResult] = useState<{
    refinedContent: string;
    contextSummary: string;
    version: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);
  const selectedContext = contextProfiles.find((c) => c.id === selectedContextId);

  const startRename = () => {
    if (!selectedSkill) return;
    console.log("[Refinery] Renaming skill:", selectedSkill.name);
    setRenameValue(selectedSkill.name);
    setIsRenaming(true);
  };

  const handleRename = async () => {
    if (!selectedSkillId || !renameValue.trim() || renameValue.trim() === selectedSkill?.name) {
      setIsRenaming(false);
      return;
    }
    console.log("[Refinery] PUT /api/user-skills/" + selectedSkillId, "→ name:", renameValue.trim());
    setRenaming(true);
    try {
      const res = await fetch(`/api/user-skills/${selectedSkillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        console.log("[Refinery] Skill renamed to:", renameValue.trim());
        onProfilesChanged();
      } else {
        console.warn("[Refinery] Rename failed: HTTP", res.status);
      }
    } finally {
      setRenaming(false);
      setIsRenaming(false);
    }
  };

  const canRefine =
    selectedSkill &&
    selectedContext &&
    selectedContext.status === "ready" &&
    !refining;

  const handleRefine = async () => {
    if (!selectedSkillId || !selectedContextId) return;
    console.log("[Refinery] Starting refinement — skill:", selectedSkill?.name, "context:", selectedContext?.name);
    console.log("[Refinery] POST /api/skills/refine { userSkillId:", selectedSkillId, ", contextProfileId:", selectedContextId, "}");
    setRefining(true);
    setRefineResult(null);
    setError(null);

    try {
      const res = await fetch("/api/skills/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userSkillId: selectedSkillId,
          contextProfileId: selectedContextId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[Refinery] Refinement complete — version:", data.version, "summary:", data.contextSummary?.slice(0, 80));
        setRefineResult(data);
        onProfilesChanged();
      } else {
        try {
          const data = await res.json();
          console.warn("[Refinery] Refinement failed:", data.error, `(HTTP ${res.status})`);
          setError(data.error || `Refinement failed (${res.status})`);
        } catch {
          console.warn("[Refinery] Refinement failed: HTTP", res.status, res.statusText);
          setError(`Server error ${res.status}: ${res.statusText}`);
        }
      }
    } catch (err: any) {
      console.error("[Refinery] Refinement error:", err?.message);
      setError(
        err?.message || "Something went wrong during refinement. The request may have timed out."
      );
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="rounded-xl border border-terminal-border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-terminal-border flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-accent text-white flex items-center justify-center text-xs font-bold font-mono">
          R
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Your Skills Refinery</h2>
          <p className="text-xs text-tertiary mt-0.5">
            Select a skill + a context file above, then refine
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Selected skill */}
        <div>
          <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1 font-mono">
            Skill
          </label>
          {selectedSkill && isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                autoFocus
                disabled={renaming}
                className="flex-1 rounded-lg border border-accent/30 bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleRename}
                disabled={renaming}
                className="btn-claude px-3 py-2 text-xs"
              >
                {renaming ? "..." : "Save"}
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                disabled={renaming}
                className="rounded-lg border border-terminal-border bg-white px-3 py-2 text-xs font-medium text-muted hover:bg-terminal-surface disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-between ${
                selectedSkill
                  ? "border-accent/20 bg-accent/5 text-[#1a1a1a]"
                  : "border-terminal-border bg-terminal-surface text-tertiary"
              }`}
            >
              <div>
                {selectedSkill
                  ? `${selectedSkill.name} (v${selectedSkill.version})`
                  : "Select a skill from My Skills above"}
                {selectedSkill && (
                  <span className="block text-[10px] text-accent mt-0.5">
                    by {userName}
                  </span>
                )}
              </div>
              {selectedSkill && (
                <button
                  onClick={startRename}
                  className="text-tertiary hover:text-accent transition-colors ml-2 flex-shrink-0"
                  title="Rename skill"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selected context */}
        <div>
          <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1 font-mono">
            Context
          </label>
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              selectedContext
                ? selectedContext.status === "ready"
                  ? "border-success/30 bg-success/10 text-[#1a1a1a]"
                  : "border-warning/30 bg-warning/10 text-[#1a1a1a]"
                : "border-terminal-border bg-terminal-surface text-tertiary"
            }`}
          >
            {selectedContext
              ? `${selectedContext.name} (v${selectedContext.version})${
                  selectedContext.status !== "ready"
                    ? " — not ready"
                    : ""
                }`
              : "Select a context from My Contexts above"}
          </div>
        </div>

        {/* Refine button */}
        <button
          onClick={handleRefine}
          disabled={!canRefine}
          className="w-full btn-claude disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {refining ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Refining with AI...
            </span>
          ) : (
            "Refine Skill"
          )}
        </button>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Success result */}
        {refineResult && (
          <div className="rounded-lg bg-success/10 border border-success/30 p-3">
            <div className="text-xs font-semibold text-green-700 mb-1">
              Refinement Complete (v{refineResult.version})
            </div>
            <p className="text-xs text-green-600 leading-relaxed">
              {refineResult.contextSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
