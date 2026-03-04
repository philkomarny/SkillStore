import { Suspense } from "react";
import { getAllSkills } from "@/lib/skills";
import { CATEGORIES } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import SkillCard from "@/components/SkillCard";
import CategoryGrid from "@/components/CategoryGrid";

export const metadata = {
  title: "Browse Skills — eduSkillsMP",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  let skills = await getAllSkills();
  const query = searchParams.q || "";
  const category = searchParams.category || "";

  if (category && CATEGORIES[category]) {
    skills = skills.filter((s) => s.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    skills = skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Browse Skills</h1>
      <p className="text-sm text-gray-500 mb-8">
        {skills.length} skill{skills.length !== 1 ? "s" : ""} available
        {category && CATEGORIES[category] ? ` in ${CATEGORIES[category].label}` : ""}
        {query ? ` matching "${query}"` : ""}
      </p>

      <div className="max-w-lg mb-8">
        <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse" />}>
          <SearchBar placeholder="Search skills..." />
        </Suspense>
      </div>

      {!category && !query && (
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
          <CategoryGrid />
        </div>
      )}

      {category && CATEGORIES[category] && (
        <div className="mb-6">
          <span className="text-2xl mr-2">{CATEGORIES[category].icon}</span>
          <span className="text-lg font-semibold text-gray-900">{CATEGORIES[category].label}</span>
          <p className="text-sm text-gray-500 mt-1">{CATEGORIES[category].description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <SkillCard key={skill.slug} skill={skill} />
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No skills found</p>
          <p className="text-sm">Try a different search term or category.</p>
        </div>
      )}
    </div>
  );
}
