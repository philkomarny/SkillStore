import Link from "next/link";
import { CATEGORIES, type SkillEntry } from "@/lib/types";
import VerificationBadge from "./VerificationBadge";
import CategoryIcon from "./CategoryIcon";

interface SkillCardProps {
  skill: SkillEntry;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const category = CATEGORIES[skill.category];

  return (
    <Link
      href={`/skills/${skill.category}/${skill.slug}`}
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {category && (
            <CategoryIcon
              name={category.icon}
              className="w-5 h-5 flex-shrink-0"
              color={category.color}
            />
          )}
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {skill.name}
          </h3>
        </div>
        <VerificationBadge level={skill.verificationLevel || 0} />
      </div>

      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {skill.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          {(skill.vouchCount || 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
              </svg>
              {skill.vouchCount}
            </span>
          )}
          <span>v{skill.version}</span>
        </div>
      </div>
    </Link>
  );
}
