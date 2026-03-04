import { notFound } from "next/navigation";
import Link from "next/link";
import { getSkillDetail } from "@/lib/skills";
import { CATEGORIES } from "@/lib/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import InstallPanel from "@/components/InstallPanel";
import VerificationBadge from "@/components/VerificationBadge";
import VouchButton from "@/components/VouchButton";
import DownloadBadge from "@/components/DownloadBadge";

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
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/skills" className="hover:text-blue-600">
          Skills
        </Link>
        <span>/</span>
        <Link href={`/skills/${params.category}`} className="hover:text-blue-600">
          {cat.label}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{skill.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{skill.name}</h1>
              <p className="text-gray-500">{skill.description}</p>
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
                  className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Skill content */}
          <div className="prose-skill border-t border-gray-100 pt-6">
            <MarkdownRenderer content={skill.content} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Verification</span>
              <VerificationBadge level={skill.verificationLevel || 0} size="md" />
            </div>
            {skill.version && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Version</span>
                <span className="text-sm font-mono text-gray-700">{skill.version}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Category</span>
              <span className="text-sm text-gray-700">
                {cat.icon} {cat.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Downloads</span>
              <DownloadBadge count={skill.downloadCount || 0} />
            </div>
            {skill.submittedBy && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Submitted by</span>
                <span className="text-sm text-gray-700">{skill.submittedBy}</span>
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

          {/* Add to Refinery CTA */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Personalize This Skill
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Import this skill into your Refinery to customize it with your
              documents, language, and processes.
            </p>
            <Link
              href={`/dashboard?skill=${skill.slug}`}
              className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white text-center hover:bg-blue-700 transition-colors"
            >
              Add to My Refinery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
