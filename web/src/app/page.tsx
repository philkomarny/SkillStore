import { Suspense } from "react";
import { getAllSkills, getDepartments, searchSkills } from "@/lib/skills";
import DepartmentGrid from "@/components/DepartmentGrid";
import SkillCard from "@/components/SkillCard";
import SearchBar from "@/components/SearchBar";

interface PageProps {
  searchParams: { q?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  const [allSkills, departments] = await Promise.all([
    getAllSkills(),
    getDepartments(),
  ]);

  const query = searchParams.q || "";
  const filteredSkills = query ? searchSkills(allSkills, query) : null;

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Claude Code Skills for Higher Education
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Browse and install curated AI skills for enrollment, marketing,
          academics, student success, and finance.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-10">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      {/* Search Results or Department Grid */}
      {filteredSkills ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {filteredSkills.length} result{filteredSkills.length !== 1 ? "s" : ""}{" "}
            for &ldquo;{query}&rdquo;
          </h2>
          {filteredSkills.length === 0 ? (
            <p className="text-gray-500">
              No skills found. Try a different search term.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Department Grid */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Browse by Department
          </h2>
          <DepartmentGrid departments={departments} />

          {/* All Skills */}
          <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-4">
            All Skills
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allSkills.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        </>
      )}

      {/* CLI Install Banner */}
      <div className="mt-12 rounded-xl bg-gray-900 text-white p-6">
        <h3 className="text-lg font-semibold mb-2">Install via CLI</h3>
        <p className="text-gray-400 text-sm mb-4">
          Add SkillStore as a marketplace in Claude Code, then install any skill.
        </p>
        <div className="space-y-2">
          <code className="block bg-gray-800 rounded-lg px-4 py-2 text-sm font-mono text-green-400">
            plugin marketplace add philkomarny/SkillStore
          </code>
          <code className="block bg-gray-800 rounded-lg px-4 py-2 text-sm font-mono text-green-400">
            plugin install curriculum-designer@skillstore
          </code>
        </div>
      </div>
    </div>
  );
}
