import Link from "next/link";
import { CATEGORIES } from "@/lib/types";
import CategoryIcon from "./CategoryIcon";

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
            className="group cursor-pointer rounded-xl border border-terminal-border bg-white p-5 hover:border-accent/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className="rounded-lg p-2 flex-shrink-0"
                style={{ backgroundColor: cat.lightColor }}
              >
                <CategoryIcon
                  name={cat.icon}
                  className="w-5 h-5"
                  color={cat.color}
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#1a1a1a] group-hover:text-accent transition-colors">
                  {cat.label}
                </h3>
                <p className="text-xs text-muted mt-1 line-clamp-2">
                  {cat.description}
                </p>
                {count > 0 && (
                  <span className="inline-block mt-2 text-[11px] font-medium text-tertiary font-mono">
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
