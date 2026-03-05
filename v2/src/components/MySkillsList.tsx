"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  refining: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Refining..." },
  refined: { bg: "bg-green-100", text: "text-green-700", label: "Refined" },
  shared: { bg: "bg-blue-100", text: "text-blue-700", label: "Shared" },
};

interface MySkillsListProps {
  skills: any[];
  selectedSkillId: string | null;
  onSelectSkill: (id: string) => void;
  onDeleteSkill: (id: string) => Promise<void>;
}

export default function MySkillsList({
  skills,
  selectedSkillId,
  onSelectSkill,
  onDeleteSkill,
}: MySkillsListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteSkill(id);
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  if (skills.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">My Skills</h2>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-400 mb-3">
            No skills yet. Import one from the marketplace to get started.
          </p>
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">My Skills</h2>
        <span className="text-xs text-gray-400">
          {skills.length} skill{skills.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {skills.map((skill) => {
          const isSelected = skill.id === selectedSkillId;
          const isConfirming = confirmingId === skill.id;
          const isDeleting = deletingId === skill.id;
          const style = STATUS_STYLES[skill.status] || STATUS_STYLES.draft;

          if (isConfirming) {
            return (
              <div
                key={skill.id}
                className="px-5 py-3.5 flex items-center justify-between bg-red-50"
              >
                <span className="text-xs text-red-700">
                  Delete <strong>{skill.name}</strong>?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(skill.id)}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={isDeleting}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={skill.id}
              className={`flex items-center transition-colors ${
                isSelected ? "bg-blue-50 border-l-2 border-blue-600" : ""
              }`}
            >
              {/* Clickable skill row — toggles selection for refinement */}
              <button
                onClick={() => onSelectSkill(skill.id)}
                className="flex-1 px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left min-w-0 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {skill.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      v{skill.version}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {skill.description}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 ml-3 whitespace-nowrap">
                  {new Date(skill.updated_at).toLocaleDateString()}
                </span>
              </button>

              {/* View icon — navigates to full skill page */}
              <Link
                href={`/dashboard/skills/${skill.id}`}
                className="px-2 py-3.5 text-gray-400 hover:text-blue-600 transition-colors"
                title="View skill"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>

              {/* Delete icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingId(skill.id);
                }}
                className="px-2 pr-4 py-3.5 text-gray-300 hover:text-red-500 transition-colors"
                title="Delete skill"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
