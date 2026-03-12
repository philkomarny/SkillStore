import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import InstallPanel from "@/components/InstallPanel";
// [USER-SKILL-STORE] replaced — https://github.com/philkomarny/SkillStore/issues/32
import { getUserSkill } from "@/lib/user-skill-store";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return {};

  const skill = await getUserSkill(params.id, session.user.id).catch(() => null);
  return {
    title: skill ? `${skill.name} — Your Skills Refinery` : "Skill — Your Skills Refinery",
  };
}

export default async function SkillViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // [USER-SKILL-STORE] replaced — https://github.com/philkomarny/SkillStore/issues/32
  // params.id is the skill slug (was Supabase UUID before #30)
  const userSkill = await getUserSkill(params.id, session.user.id).catch(() => null);
  if (!userSkill) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6 font-mono">
        <Link href="/dashboard" className="hover:text-accent">
          Your Skills Refinery
        </Link>
        <span className="text-tertiary">/</span>
        <span className="text-[#1a1a1a] font-medium">{userSkill.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold font-mono text-[#1a1a1a] mb-2">
                {userSkill.name}
              </h1>
              {userSkill.description && (
                <p className="text-muted">{userSkill.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-mono text-tertiary">
                v{userSkill.version}
              </span>
              {userSkill.status === "refined" && (
                <span className="inline-flex items-center rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Refined
                </span>
              )}
            </div>
          </div>

          {/* Skill content — rendered markdown */}
          <div className="prose-skill border-t border-terminal-border pt-6">
            {userSkill.content ? (
              <MarkdownRenderer content={userSkill.content} />
            ) : (
              <p className="text-sm text-tertiary">No content available.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Back to Refinery */}
          <Link
            href="/dashboard"
            className="btn-claude block w-full text-center"
          >
            &larr; Back to Your Skills Refinery
          </Link>

          {/* Meta info */}
          <div className="rounded-xl border border-terminal-border bg-white overflow-hidden divide-y divide-terminal-border">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted">Author</span>
              <span className="text-sm font-medium text-[#1a1a1a]">
                {session.user.name || session.user.email}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted">Version</span>
              <span className="text-sm font-mono font-medium text-[#1a1a1a]">
                {userSkill.version}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted">Status</span>
              <span className="text-sm font-medium text-[#1a1a1a] capitalize">
                {userSkill.status || "draft"}
              </span>
            </div>
            {userSkill.updated_at && (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-muted">Updated</span>
                <span className="text-sm font-medium font-mono text-[#1a1a1a]">
                  {new Date(userSkill.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Install panel — same as marketplace */}
          <InstallPanel
            skillName={userSkill.name}
            skillSlug={userSkill.slug}
            rawContent={userSkill.content}
            source=""
          />
        </div>
      </div>
    </div>
  );
}
