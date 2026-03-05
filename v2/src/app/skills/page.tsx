import { Suspense } from "react";
import { getAllSkills } from "@/lib/skills";
import { CATEGORIES } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import SkillCard from "@/components/SkillCard";
import CategoryGrid from "@/components/CategoryGrid";
import CategoryIcon from "@/components/CategoryIcon";
import SectionHeading from "@/components/SectionHeading";

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
      <SectionHeading as="h1">Browse Skills</SectionHeading>
      <p className="text-sm text-muted mb-8">
        {skills.length} skill{skills.length !== 1 ? "s" : ""} available
        {category && CATEGORIES[category] ? ` in ${CATEGORIES[category].label}` : ""}
        {query ? ` matching "${query}"` : ""}
      </p>

      <div className="max-w-lg mb-8">
        <Suspense fallback={<div className="h-10 bg-terminal-surface rounded-lg animate-pulse" />}>
          <SearchBar placeholder="Search skills..." />
        </Suspense>
      </div>

      {!category && !query && (
        <div className="mb-12">
          <SectionHeading>Categories</SectionHeading>
          <CategoryGrid />
        </div>
      )}

      {category && CATEGORIES[category] && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon
              name={CATEGORIES[category].icon}
              className="w-6 h-6"
              color={CATEGORIES[category].color}
            />
            <span className="text-lg font-semibold font-mono text-[#1a1a1a]">{CATEGORIES[category].label}</span>
          </div>
          <p className="text-sm text-muted mt-1">{CATEGORIES[category].description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <SkillCard key={skill.slug} skill={skill} />
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-16 text-tertiary">
          <p className="text-lg mb-2 font-mono">No skills found</p>
          <p className="text-sm text-muted">Try a different search term or category.</p>
        </div>
      )}
    </div>
  );
}
