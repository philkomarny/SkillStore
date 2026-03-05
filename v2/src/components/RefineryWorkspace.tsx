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
    setRenameValue(selectedSkill.name);
    setIsRenaming(true);
  };

  const handleRename = async () => {
    if (!selectedSkillId || !renameValue.trim() || renameValue.trim() === selectedSkill?.name) {
      setIsRenaming(false);
      return;
    }
    setRenaming(true);
    try {
      const res = await fetch(`/api/user-skills/${selectedSkillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        onProfilesChanged();
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
        setRefineResult(data);
        onProfilesChanged();
      } else {
        try {
          const data = await res.json();
          setError(data.error || `Refinement failed (${res.status})`);
        } catch {
          setError(`Server error ${res.status}: ${res.statusText}`);
        }
      }
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong during refinement. The request may have timed out."
      );
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          R
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Your Skills Refinery</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Select a skill + a context file above, then refine
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Selected skill */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleRename}
                disabled={renaming}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {renaming ? "..." : "Save"}
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                disabled={renaming}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-between ${
                selectedSkill
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-gray-50 text-gray-400"
              }`}
            >
              <div>
                {selectedSkill
                  ? `${selectedSkill.name} (v${selectedSkill.version})`
                  : "Select a skill from My Skills above"}
                {selectedSkill && (
                  <span className="block text-[10px] text-blue-600 mt-0.5">
                    by {userName}
                  </span>
                )}
              </div>
              {selectedSkill && (
                <button
                  onClick={startRename}
                  className="text-blue-400 hover:text-blue-700 transition-colors ml-2 flex-shrink-0"
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
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Context
          </label>
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              selectedContext
                ? selectedContext.status === "ready"
                  ? "border-green-200 bg-green-50 text-green-900"
                  : "border-yellow-200 bg-yellow-50 text-yellow-900"
                : "border-gray-200 bg-gray-50 text-gray-400"
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
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          <div className="rounded-lg bg-green-50 border border-green-200 p-3">
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
