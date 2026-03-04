import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

interface CategoryGridProps {
  skillCounts?: Record<string, number>;
}

export default function CategoryGrid({ skillCounts = {} }: CategoryGridProps) {
  const categories = Object.values(CATEGORIES);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const count = skillCounts[cat.id] || 0;
        return (
          <Link
            key={cat.id}
            href={`/skills/${cat.id}`}
            className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{cat.icon}</span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {cat.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {cat.description}
                </p>
                {count > 0 && (
                  <span className="inline-block mt-2 text-[11px] font-medium text-gray-400">
                    {count} skill{count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
