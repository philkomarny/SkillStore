"use client";

import { useState } from "react";
import ContextBuilder from "@/components/ContextBuilder";

const CTX_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  building: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Building..." },
  ready: { bg: "bg-green-100", text: "text-green-700", label: "Ready" },
};

interface RefineryWorkspaceProps {
  skills: any[];
  contextProfiles: any[];
  selectedSkillId: string | null;
  selectedContextId: string | null;
  onSelectContext: (id: string) => void;
  onProfilesChanged: () => void;
}

export default function RefineryWorkspace({
  skills,
  contextProfiles,
  selectedSkillId,
  selectedContextId,
  onSelectContext,
  onProfilesChanged,
}: RefineryWorkspaceProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineResult, setRefineResult] = useState<{
    refinedContent: string;
    contextSummary: string;
    version: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);
  const selectedContext = contextProfiles.find((c) => c.id === selectedContextId);

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
        // Signal parent to refresh data
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

  const handleContextCreated = (profile: any) => {
    setShowBuilder(false);
    onSelectContext(profile.id);
    onProfilesChanged();
  };

  return (
    <div className="space-y-4">
      {/* Section A: Context Files */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Context Files
          </h2>
          {!showBuilder && (
            <button
              onClick={() => setShowBuilder(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + New Context
            </button>
          )}
        </div>

        {showBuilder && (
          <div className="p-4 border-b border-gray-100">
            <ContextBuilder
              onCreated={handleContextCreated}
              onCancel={() => setShowBuilder(false)}
            />
          </div>
        )}

        {contextProfiles.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {contextProfiles.map((ctx) => {
              const isSelected = ctx.id === selectedContextId;
              const style =
                CTX_STATUS_STYLES[ctx.status] || CTX_STATUS_STYLES.draft;
              return (
                <button
                  key={ctx.id}
                  onClick={() => onSelectContext(ctx.id)}
                  className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${
                    isSelected ? "bg-blue-50 border-l-2 border-blue-600" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {ctx.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        v{ctx.version}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 ml-3 whitespace-nowrap">
                    {new Date(ctx.updated_at).toLocaleDateString()}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          !showBuilder && (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-gray-400 mb-3">
                No context files yet. Create one by uploading your institutional documents.
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                + Create Your First Context
              </button>
            </div>
          )
        )}
      </div>

      {/* Section B: Refine Operation */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Refine</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Select a skill + a context file, then refine
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Selected skill */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Skill
            </label>
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                selectedSkill
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-gray-50 text-gray-400"
              }`}
            >
              {selectedSkill
                ? `${selectedSkill.name} (v${selectedSkill.version})`
                : "Select a skill from the left"}
            </div>
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
                : "Select a context file above"}
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
    </div>
  );
}
