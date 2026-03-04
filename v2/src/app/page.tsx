import { Suspense } from "react";
import Link from "next/link";
import { getAllSkills } from "@/lib/skills";
import { CATEGORIES } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import SkillCard from "@/components/SkillCard";

export default async function HomePage() {
  const skills = await getAllSkills();
  const featured = skills.filter((s) => s.isFeatured).slice(0, 4);
  const recent = skills.slice(0, 8);
  const categoryCount = Object.keys(CATEGORIES).length;

  const skillCounts: Record<string, number> = {};
  for (const s of skills) {
    skillCounts[s.category] = (skillCounts[s.category] || 0) + 1;
  }

  return (
    <div>
      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
          The Edu Skills Marketplace
          <br />
          <span className="text-blue-600">for Claude</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Browse, install, and personalize verified skills.{" "}
          <span className="text-gray-700 font-medium">{skills.length} skills</span> across{" "}
          <span className="text-gray-700 font-medium">{categoryCount} categories</span>.
        </p>
        <div className="max-w-lg mx-auto">
          <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse" />}>
            <SearchBar placeholder="Search skills..." />
          </Suspense>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Browse",
              desc: "Find skills across education-focused categories, verified for quality and safety.",
            },
            {
              step: "2",
              title: "Install",
              desc: "One-click install for Claude Desktop, Claude Code, or as a project file.",
            },
            {
              step: "3",
              title: "Add Context",
              desc: "Upload your docs and brand assets — AI generates personalized context for each skill.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center p-6 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verification legend */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600 font-medium">
              <span>🌐</span> Community
            </span>
            Free, open source
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
              <span>🤖</span> Bot Verified
            </span>
            Security scanned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700 font-medium">
              <span>👤</span> Expert Verified
            </span>
            Human reviewed
          </span>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <CategoryGrid skillCounts={skillCounts} />
      </section>

      {/* Featured skills */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Featured Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {/* Recent / All skills */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {featured.length > 0 ? "Recent Additions" : "All Skills"}
          </h2>
          <Link
            href="/skills"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recent.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Have a skill to share?</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Submit your Claude skill to the marketplace. Community skills are always free.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Submit a Skill
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            See Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
