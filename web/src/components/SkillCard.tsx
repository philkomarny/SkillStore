import Link from "next/link";
import { DEPARTMENTS } from "@/lib/types";
import type { SkillEntry } from "@/lib/types";

interface SkillCardProps {
  skill: SkillEntry;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const dept = DEPARTMENTS[skill.category];

  return (
    <Link
      href={`/skills/${skill.category}/${skill.name}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
          {skill.name}
        </h3>
        <span className="text-xs text-gray-400 font-mono">
          v{skill.version}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {skill.description}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {dept && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: dept.lightColor,
              color: dept.color,
            }}
          >
            {dept.label}
          </span>
        )}
        {skill.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
