import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Dashboard — eduSkillsMP",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const profile = await getUserProfile(session.user.id);

  // Get user's contexts
  const { data: contexts } = (await supabase
    .from("user_contexts")
    .select("skill_slug, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })) as { data: any[] | null };

  // Get user's purchases
  const { data: purchases } = (await supabase
    .from("purchases")
    .select("skill_id, created_at, skills(slug, name)")
    .eq("user_id", session.user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })) as { data: any[] | null };

  const tierLabel =
    profile?.subscriptionTier === "level2"
      ? "Level 2 (Unlimited)"
      : profile?.subscriptionTier === "level1"
      ? "Level 1"
      : "Free";

  const tierColor =
    profile?.subscriptionTier === "level2"
      ? "bg-green-100 text-green-700"
      : profile?.subscriptionTier === "level1"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tierColor}`}>
          {tierLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Subscription card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Plan
          </h3>
          <p className="text-lg font-bold text-gray-900 mb-1">{tierLabel}</p>
          <p className="text-xs text-gray-500 mb-3">
            {profile?.subscriptionStatus === "active"
              ? "Active subscription"
              : profile?.trialStartedAt
              ? "Trial active"
              : "No active subscription"}
          </p>
          <Link
            href="/dashboard/billing"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage billing →
          </Link>
        </div>

        {/* Contexts count */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Contexts
          </h3>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {contexts?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Personalized skill contexts</p>
        </div>

        {/* Purchases count */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Purchased Skills
          </h3>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {purchases?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Individual skill purchases</p>
        </div>
      </div>

      {/* Contexts list */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">My Contexts</h2>
        </div>
        {contexts && contexts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {contexts.map((ctx) => (
              <div
                key={ctx.skill_slug}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {ctx.skill_slug}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    Updated {new Date(ctx.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  href={`/skills/${ctx.skill_slug}`}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-xs text-gray-400">
            No contexts yet. Upload documents on any skill page to get started.
          </div>
        )}
      </div>

      {/* Purchases list */}
      {purchases && purchases.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Purchased Skills
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {purchases.map((p: any) => (
              <div
                key={p.skill_id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {p.skills?.name || p.skills?.slug || "Skill"}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-xs text-green-600 font-medium">$0.99</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
