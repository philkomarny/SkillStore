import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSkillsByCategory } from "@/lib/skills";
import { CATEGORIES } from "@/lib/types";
import SkillCard from "@/components/SkillCard";
import SearchBar from "@/components/SearchBar";

export async function generateMetadata({ params }: { params: { category: string } }) {
  const cat = CATEGORIES[params.category];
  if (!cat) return {};
  return {
    title: `${cat.label} Skills — eduSkillsMP`,
    description: cat.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { q?: string };
}) {
  const cat = CATEGORIES[params.category];
  if (!cat) notFound();

  let skills = await getSkillsByCategory(params.category);

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    skills = skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-2">
        <Link href="/skills" className="text-sm text-accent hover:text-accent-hover font-mono">
          &larr; All categories
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{cat.icon}</span>
        <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">{cat.label}</h1>
      </div>
      <p className="text-sm text-muted mb-8">{cat.description}</p>

      <div className="max-w-lg mb-8">
        <Suspense fallback={<div className="h-10 bg-terminal-surface rounded-lg animate-pulse" />}>
          <SearchBar placeholder={`Search ${cat.label.toLowerCase()} skills...`} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <SkillCard key={skill.slug} skill={skill} />
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-16 text-tertiary">
          <p className="text-lg mb-2 font-mono">No skills in this category yet</p>
          <p className="text-sm">
            <Link href="/submit" className="text-accent hover:underline">
              Submit the first one
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
