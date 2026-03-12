"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-terminal-surface", text: "text-muted", label: "Draft" },
  refining: { bg: "bg-warning/20", text: "text-yellow-700", label: "Refining..." },
  refined: { bg: "bg-success/20", text: "text-green-700", label: "Refined" },
  shared: { bg: "bg-accent/10", text: "text-accent", label: "Shared" },
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
    const skill = skills.find((s) => s.slug === id);
    console.log("[MySkillsList] Deleting skill:", skill?.name ?? id);
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
      <div className="rounded-xl border border-terminal-border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-terminal-border">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">My Skills</h2>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-tertiary mb-3">
            No skills yet. Import one from the marketplace to get started.
          </p>
          <Link
            href="/skills"
            className="btn-claude inline-flex items-center gap-2"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-terminal-border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-terminal-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">My Skills</h2>
        <span className="text-xs text-tertiary font-mono">
          {skills.length} skill{skills.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-terminal-border">
        {skills.map((skill) => {
          const isSelected = skill.slug === selectedSkillId;
          const isConfirming = confirmingId === skill.slug;
          const isDeleting = deletingId === skill.slug;
          const style = STATUS_STYLES[skill.status] || STATUS_STYLES.draft;

          if (isConfirming) {
            return (
              <div
                key={skill.slug}
                className="px-5 py-3.5 flex items-center justify-between bg-red-50"
              >
                <span className="text-xs text-red-700">
                  Delete <strong>{skill.name}</strong>?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(skill.slug)}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={isDeleting}
                    className="rounded-lg border border-terminal-border bg-white px-3 py-1 text-xs font-medium text-muted hover:bg-terminal-surface disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={skill.slug}
              className={`flex items-center transition-colors ${
                isSelected ? "bg-accent/5 border-l-2 border-accent" : ""
              }`}
            >
              <button
                onClick={() => { console.log("[MySkillsList] Clicked skill:", skill.name, "(id:", skill.slug + ")"); onSelectSkill(skill.slug); }}
                className="flex-1 px-5 py-3.5 flex items-center justify-between hover:bg-terminal-surface transition-colors text-left min-w-0 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1a1a1a] truncate">
                      {skill.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-[10px] text-tertiary font-mono">
                      v{skill.version}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-xs text-tertiary truncate mt-0.5">
                      {skill.description}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-tertiary ml-3 whitespace-nowrap font-mono">
                  {new Date(skill.updated_at).toLocaleDateString()}
                </span>
              </button>

              <Link
                href={`/dashboard/skills/${skill.slug}`}
                className="px-2 py-3.5 text-tertiary hover:text-accent transition-colors"
                title="View skill"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("[MySkillsList] Delete requested for skill:", skill.name);
                  setConfirmingId(skill.slug);
                }}
                className="px-2 pr-4 py-3.5 text-terminal-border hover:text-red-500 transition-colors"
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
