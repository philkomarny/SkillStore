import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
import ContextUploader from "@/components/ContextUploader";

export const metadata = {
  title: "Your Refinery — eduSkillsMP",
};

// Status badge colors
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  refining: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Refining..." },
  refined: { bg: "bg-green-100", text: "text-green-700", label: "Refined" },
  shared: { bg: "bg-blue-100", text: "text-blue-700", label: "Shared" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { skill?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const profile = await getUserProfile(session.user.id);

  // Get user's skills from user_skills table
  const supabase = getClient();
  const { data: userSkills } = (await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", profile?.id)
    .order("updated_at", { ascending: false })) as { data: any[] | null };

  // If a skill id is passed via query param, use it for the active Refinery view
  const activeSkillId = searchParams.skill || null;
  const activeSkill = activeSkillId
    ? userSkills?.find((s) => s.id === activeSkillId)
    : null;

  // Fetch active skill content from storage if selected
  let activeContent: string | null = null;
  if (activeSkill?.storage_path) {
    const { data: fileData } = await supabase.storage
      .from("refined-skills")
      .download(activeSkill.storage_path);
    if (fileData) {
      activeContent = await fileData.text();
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Refinery</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <Link
          href="/skills"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse Marketplace
        </Link>
      </div>

      {/* The Refinery — Active Skill */}
      {activeSkill ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              R
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeSkill.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    STATUS_STYLES[activeSkill.status]?.bg || "bg-gray-100"
                  } ${STATUS_STYLES[activeSkill.status]?.text || "text-gray-600"}`}
                >
                  {STATUS_STYLES[activeSkill.status]?.label || activeSkill.status}
                </span>
                <span className="text-[11px] text-gray-400">
                  v{activeSkill.version}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              &times; Close
            </Link>
          </div>

          {/* Skill Content Preview */}
          {activeContent && (
            <div className="rounded-lg bg-white border border-blue-100 p-4 mb-4 max-h-64 overflow-y-auto">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Current Skill Content (v{activeSkill.version})
              </div>
              <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
                {activeContent.slice(0, 2000)}
                {activeContent.length > 2000 && "\n\n... (truncated)"}
              </pre>
            </div>
          )}

          {/* Context Summary */}
          {activeSkill.context_summary && (
            <div className="rounded-lg bg-white border border-green-100 p-4 mb-4">
              <div className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-2">
                Extracted Context
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {activeSkill.context_summary}
              </p>
            </div>
          )}

          {/* Upload files for refinement */}
          <ContextUploader
            skillSlug={activeSkill.base_skill_slug}
            skillDescription={activeSkill.description || ""}
            existingContext={activeSkill.context_summary}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              R
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                The Refinery
              </h2>
              <p className="text-xs text-gray-500">
                Select a skill from below or browse the marketplace to get started
              </p>
            </div>
          </div>
          <div className="rounded-xl border-2 border-dashed border-blue-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Import a skill from the marketplace. Upload your documents.
              The AI rewrites the skill with your context baked in.
            </p>
            <Link
              href="/skills"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Browse Skills to Import
            </Link>
          </div>
        </div>
      )}

      {/* My Skills */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            My Skills
          </h2>
          <span className="text-xs text-gray-400">
            {userSkills?.length || 0} skill{(userSkills?.length || 0) !== 1 ? "s" : ""}
          </span>
        </div>
        {userSkills && userSkills.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {userSkills.map((skill) => {
              const isActive = skill.id === activeSkillId;
              const style = STATUS_STYLES[skill.status] || STATUS_STYLES.draft;
              return (
                <Link
                  key={skill.id}
                  href={`/dashboard?skill=${skill.id}`}
                  className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors block ${
                    isActive ? "bg-blue-50 border-l-2 border-blue-600" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {skill.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        v{skill.version}
                      </span>
                      {skill.is_shareable && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                          Shared
                        </span>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {skill.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(skill.updated_at).toLocaleDateString()}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400 mb-3">
              No skills in your Refinery yet. Import one from the marketplace to get started.
            </p>
            <Link
              href="/skills"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse the Marketplace &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Account
            </h3>
            <p className="text-sm font-medium text-gray-900">
              {profile?.subscriptionTier === "level2"
                ? "Level 2 (Unlimited)"
                : profile?.subscriptionTier === "level1"
                ? "Level 1"
                : "Free Plan"}
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage billing &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
