import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { supabase } from "@/lib/supabase";
import { getAllSkills } from "@/lib/skills";
import ContextUploader from "@/components/ContextUploader";

export const metadata = {
  title: "Your Refinery — eduSkillsMP",
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

  // Get user's contexts
  const { data: contexts } = (await supabase
    .from("user_contexts")
    .select("skill_slug, context_markdown, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })) as { data: any[] | null };

  // Get all skills from marketplace for lookups
  const allSkills = await getAllSkills();
  const skillMap = new Map(allSkills.map((s) => [s.slug, s]));

  // If a skill slug is passed via query param, use it for the Refinery
  const activeSkillSlug = searchParams.skill || null;
  const activeSkill = activeSkillSlug ? skillMap.get(activeSkillSlug) : null;

  // Find existing context for the active skill
  const activeContext = activeSkillSlug
    ? contexts?.find((c) => c.skill_slug === activeSkillSlug)?.context_markdown || null
    : null;

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
      <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            R
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeSkill ? `Refining: ${activeSkill.name}` : "The Refinery"}
            </h2>
            <p className="text-xs text-gray-500">
              {activeSkill
                ? "Upload your documents to personalize this skill"
                : "Select a skill from below or browse the marketplace to get started"}
            </p>
          </div>
        </div>

        {activeSkill ? (
          <ContextUploader
            skillSlug={activeSkill.slug}
            skillDescription={activeSkill.description}
            existingContext={activeContext}
          />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-blue-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Choose a skill to refine. Import one from the marketplace, or
              select from your existing skills below.
            </p>
            <Link
              href="/skills"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Browse Skills to Import
            </Link>
          </div>
        )}
      </div>

      {/* My Refined Skills */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            My Refined Skills
          </h2>
          <span className="text-xs text-gray-400">
            {contexts?.length || 0} skill{(contexts?.length || 0) !== 1 ? "s" : ""}
          </span>
        </div>
        {contexts && contexts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {contexts.map((ctx) => {
              const skill = skillMap.get(ctx.skill_slug);
              const isActive = ctx.skill_slug === activeSkillSlug;
              return (
                <Link
                  key={ctx.skill_slug}
                  href={`/dashboard?skill=${ctx.skill_slug}`}
                  className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors block ${
                    isActive ? "bg-blue-50 border-l-2 border-blue-600" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {skill?.name || ctx.skill_slug}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Refined
                      </span>
                    </div>
                    {skill && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {skill.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(ctx.updated_at).toLocaleDateString()}
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
              No refined skills yet. Import a skill from the marketplace to get started.
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
