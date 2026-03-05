import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
import DashboardClient from "@/components/DashboardClient";

export const metadata = {
  title: "Your Skills Refinery — eduSkillsMP",
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

  const supabase = getClient();

  // Fetch user's skills
  const { data: userSkills } = (await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", profile?.id)
    .order("updated_at", { ascending: false })) as { data: any[] | null };

  // Fetch user's context profiles
  const { data: contextProfiles } = (await supabase
    .from("context_profiles")
    .select("*")
    .eq("user_id", profile?.id)
    .order("updated_at", { ascending: false })) as { data: any[] | null };

  const skills = userSkills || [];
  const contexts = contextProfiles || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#1a1a1a]">
            <span className="text-accent">#</span> Your Skills Refinery
          </h1>
          <p className="text-sm text-muted">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <Link
          href="/skills"
          className="btn-claude gap-1.5"
        >
          Browse Marketplace
        </Link>
      </div>

      {/* Main Content — always show the three-row layout */}
      <DashboardClient
        skills={skills}
        contextProfiles={contexts}
        initialSkillId={searchParams.skill || null}
        userName={session.user.name || session.user.email || "You"}
      />

      {/* Account Info */}
      <div className="rounded-xl border border-terminal-border bg-white p-5 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-1 font-mono">
              Account
            </h3>
            <p className="text-sm font-medium text-[#1a1a1a]">
              {profile?.subscriptionTier === "level2"
                ? "Level 2 (Unlimited)"
                : profile?.subscriptionTier === "level1"
                ? "Level 1"
                : "Free Plan"}
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="text-xs text-accent hover:text-accent-hover font-medium font-mono"
          >
            Manage billing &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
