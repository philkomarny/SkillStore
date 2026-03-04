import { supabase } from "./supabase";

/**
 * Check whether a user can access (install) a skill based on its verification level.
 *
 * Rules:
 * - Level 0 (Community): always free, no account needed
 * - Level 1 (Bot Verified): free for 30 days after signup, then $0.99/skill
 * - Level 2 (Expert Verified): requires active Level 2 subscription ($50/mo)
 */
export async function canAccessSkill(
  userId: string | null,
  skillSlug: string,
  verificationLevel: number
): Promise<{ allowed: boolean; reason: string }> {
  // Community skills are always free
  if (verificationLevel === 0) {
    return { allowed: true, reason: "community" };
  }

  // Verified skills require an account
  if (!userId) {
    return { allowed: false, reason: "login_required" };
  }

  // Get user data
  const { data: user } = (await supabase
    .from("users")
    .select("subscription_tier, subscription_status, trial_started_at")
    .eq("id", userId)
    .single()) as { data: any };

  if (!user) {
    return { allowed: false, reason: "login_required" };
  }

  // Level 2 subscribers get everything
  if (
    user.subscription_tier === "level2" &&
    user.subscription_status === "active"
  ) {
    return { allowed: true, reason: "subscription" };
  }

  // Check 30-day trial window
  if (user.trial_started_at) {
    const trialStart = new Date(user.trial_started_at);
    const now = new Date();
    const daysSinceTrialStart =
      (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceTrialStart <= 30) {
      return { allowed: true, reason: "trial" };
    }
  }

  // Level 1: check for individual purchase
  if (verificationLevel === 1) {
    const { data: skill } = (await supabase
      .from("skills")
      .select("id")
      .eq("slug", skillSlug)
      .single()) as { data: any };

    if (skill) {
      const { data: purchase } = (await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("skill_id", skill.id)
        .eq("status", "completed")
        .single()) as { data: any };

      if (purchase) {
        return { allowed: true, reason: "purchased" };
      }
    }

    return { allowed: false, reason: "purchase_required" };
  }

  // Level 2: subscription required
  if (verificationLevel === 2) {
    return { allowed: false, reason: "subscription_required" };
  }

  return { allowed: false, reason: "unknown" };
}
