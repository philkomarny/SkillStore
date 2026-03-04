"use client";

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
}

export default function MySkillsList({
  skills,
  selectedSkillId,
  onSelectSkill,
}: MySkillsListProps) {
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
          const style = STATUS_STYLES[skill.status] || STATUS_STYLES.draft;
          return (
            <button
              key={skill.id}
              onClick={() => onSelectSkill(skill.id)}
              className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${
                isSelected ? "bg-blue-50 border-l-2 border-blue-600" : ""
              }`}
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
          );
        })}
      </div>
    </div>
  );
}
