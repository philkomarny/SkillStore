import { Suspense } from "react";
import Link from "next/link";
import { getAllSkills } from "@/lib/skills";
import { CATEGORIES } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import SkillCard from "@/components/SkillCard";
import TerminalWindow from "@/components/TerminalWindow";
import SectionHeading from "@/components/SectionHeading";
import VerificationBadge from "@/components/VerificationBadge";

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
      {/* Terminal Hero */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <TerminalWindow title="eduSkillsMP">
            <div className="terminal-body">
              <p>
                <span className="terminal-prompt">$</span>{" "}
                <span className="terminal-command">eduSkillsMP</span>{" "}
                <span className="terminal-output">--about</span>
              </p>
              <p className="terminal-comment mt-2">
                # The community-driven catalog of verified Claude skills
              </p>
              <p className="terminal-comment">
                # built for higher education and K-12.
              </p>
              <p className="mt-3">
                <span className="terminal-prompt">$</span>{" "}
                <span className="terminal-command">browse</span>{" "}
                <span className="terminal-output">--count</span>
              </p>
              <p className="text-white mt-1">
                Found <span className="text-warning font-bold">{skills.length}</span> verified skills across{" "}
                <span className="text-warning font-bold">{categoryCount}</span> categories.
              </p>
              <p className="mt-3">
                <span className="terminal-prompt">$</span>{" "}
                <span className="terminal-command animate-pulse">_</span>
              </p>
            </div>
          </TerminalWindow>

          <div className="mt-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold font-mono text-[#1a1a1a] mb-4">
              The skills your campus needs.
              <br />
              <span className="text-accent">Verified by the people who get it.</span>
            </h1>
            <p className="text-muted max-w-xl mx-auto mb-3">
              Browse by role. Install with confidence. Refine for your campus.
            </p>
            <p className="text-sm font-mono text-tertiary mb-8">
              Built by educators. Verified by the community. Ready for your campus.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/skills" className="btn-claude">
                $ browse --catalog
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-terminal-border bg-white px-5 py-2.5 text-sm font-mono font-medium text-muted hover:bg-terminal-surface transition-colors"
              >
                $ --how-it-works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="max-w-lg mx-auto px-4 pb-16">
        <Suspense fallback={<div className="h-10 bg-terminal-surface rounded-lg animate-pulse" />}>
          <SearchBar placeholder="Search skills..." />
        </Suspense>
      </section>

      {/* How it works — 3 steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              cmd: "$ browse",
              title: "Browse",
              desc: "Find skills across education-focused categories, verified for quality and safety.",
            },
            {
              cmd: "$ install --skill",
              title: "Install",
              desc: "One-click install for Claude Desktop, Claude Code, or as a project file.",
            },
            {
              cmd: "$ refine --context",
              title: "Add Context",
              desc: "Upload your docs and brand assets — AI generates personalized context for each skill.",
            },
          ].map((item) => (
            <div key={item.cmd} className="p-6 rounded-xl bg-terminal-surface border border-terminal-border">
              <code className="text-xs font-mono text-accent font-bold">{item.cmd}</code>
              <h3 className="font-semibold text-[#1a1a1a] mt-2 mb-1">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verification legend */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <VerificationBadge level={0} />
            Free, open source
          </span>
          <span className="flex items-center gap-1.5">
            <VerificationBadge level={1} />
            Security scanned
          </span>
          <span className="flex items-center gap-1.5">
            <VerificationBadge level={2} />
            Human reviewed
          </span>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <SectionHeading>Browse by Category</SectionHeading>
        <div className="mt-6">
          <CategoryGrid skillCounts={skillCounts} />
        </div>
      </section>

      {/* Featured skills */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <SectionHeading>Featured Skills</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {featured.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {/* Recent / All skills */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <SectionHeading>
            {featured.length > 0 ? "Recent Additions" : "All Skills"}
          </SectionHeading>
          <Link
            href="/skills"
            className="text-sm text-accent hover:text-accent-hover font-medium font-mono"
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
      <section className="bg-terminal-surface border-t border-terminal-border py-16 px-4 text-center">
        <h2 className="text-2xl font-bold font-mono text-[#1a1a1a] mb-3">
          This is a community, not a storefront.
        </h2>
        <p className="text-muted mb-6 max-w-lg mx-auto">
          Every verified skill. Every refinement. Every review. That&apos;s someone in education
          deciding that the next person shouldn&apos;t have to figure this out alone.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/submit" className="btn-claude">
            $ submit --skill
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg border border-terminal-border bg-white px-5 py-2.5 text-sm font-mono font-medium text-muted hover:bg-terminal-surface transition-colors"
          >
            $ --pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
