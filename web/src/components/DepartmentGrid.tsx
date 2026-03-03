import Link from "next/link";
import { DEPARTMENTS, type Department } from "@/lib/types";

interface DepartmentGridProps {
  departments: { id: string; count: number }[];
}

export default function DepartmentGrid({ departments }: DepartmentGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map(({ id, count }) => {
        const dept: Department | undefined = DEPARTMENTS[id];
        if (!dept) return null;

        return (
          <Link
            key={id}
            href={`/skills/${id}`}
            className="group block rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl">{dept.icon}</span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {dept.label}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {dept.description}
                </p>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: dept.lightColor,
                  color: dept.color,
                }}
              >
                {count} {count === 1 ? "skill" : "skills"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
