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
          <h1 className="text-2xl font-bold text-gray-900">Your Skills Refinery</h1>
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

      {/* Main Content — always show the three-row layout */}
      <DashboardClient
        skills={skills}
        contextProfiles={contexts}
        initialSkillId={searchParams.skill || null}
        userName={session.user.name || session.user.email || "You"}
      />

      {/* Account Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mt-6">
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
