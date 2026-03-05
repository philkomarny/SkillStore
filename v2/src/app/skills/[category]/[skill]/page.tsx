export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSkillDetail } from "@/lib/skills";
import { CATEGORIES } from "@/lib/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import InstallPanel from "@/components/InstallPanel";
import VerificationBadge from "@/components/VerificationBadge";
import VouchButton from "@/components/VouchButton";
import DownloadBadge from "@/components/DownloadBadge";
import AddToRefinery from "@/components/AddToRefinery";

export async function generateMetadata({
  params,
}: {
  params: { category: string; skill: string };
}) {
  const detail = await getSkillDetail(params.skill);
  if (!detail) return {};
  return {
    title: `${detail.name} — eduSkillsMP`,
    description: detail.description,
  };
}

export default async function SkillDetailPage({
  params,
}: {
  params: { category: string; skill: string };
}) {
  const cat = CATEGORIES[params.category];
  if (!cat) notFound();

  const skill = await getSkillDetail(params.skill);
  if (!skill) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6 font-mono">
        <Link href="/skills" className="hover:text-accent">
          Skills
        </Link>
        <span className="text-tertiary">/</span>
        <Link href={`/skills/${params.category}`} className="hover:text-accent">
          {cat.label}
        </Link>
        <span className="text-tertiary">/</span>
        <span className="text-[#1a1a1a] font-medium">{skill.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold font-mono text-[#1a1a1a] mb-2">{skill.name}</h1>
              <p className="text-muted">{skill.description}</p>
            </div>
            <VouchButton
              skillSlug={skill.slug}
              initialCount={skill.vouchCount || 0}
            />
          </div>

          {/* Tags */}
          {skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-terminal-surface px-2.5 py-0.5 text-xs text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Skill content */}
          <div className="prose-skill border-t border-terminal-border pt-6">
            <MarkdownRenderer content={skill.content} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add to Refinery */}
          <AddToRefinery skillSlug={skill.slug} />

          {/* Meta info */}
          <div className="rounded-xl border border-terminal-border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Verification</span>
              <VerificationBadge level={skill.verificationLevel || 0} size="md" />
            </div>
            {skill.version && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Version</span>
                <span className="text-sm font-mono text-[#1a1a1a]">{skill.version}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Category</span>
              <span className="text-sm text-[#1a1a1a]">
                {cat.icon} {cat.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Downloads</span>
              <DownloadBadge count={skill.downloadCount || 0} />
            </div>
            {skill.submittedBy && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Submitted by</span>
                <span className="text-sm text-[#1a1a1a]">{skill.submittedBy}</span>
              </div>
            )}
          </div>

          {/* Install panel */}
          <InstallPanel
            skillName={skill.slug}
            skillSlug={skill.slug}
            rawContent={skill.rawContent}
            source={skill.source}
            contextContent={skill.contextContent}
          />
        </div>
      </div>
    </div>
  );
}
