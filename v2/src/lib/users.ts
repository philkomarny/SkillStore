import { getClient } from "./supabase";
import type { UserProfile } from "./types";

export async function upsertUser(data: {
  githubId: string;
  githubUsername: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<void> {
  const supabase = getClient();
  await (supabase.from("users") as any).upsert(
    {
      github_id: data.githubId,
      github_username: data.githubUsername,
      email: data.email || null,
      display_name: data.displayName || null,
      avatar_url: data.avatarUrl || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "github_id" }
  );
}

export async function getUserProfile(
  githubId: string
): Promise<UserProfile | null> {
  const supabase = getClient();
  const { data, error } = (await supabase
    .from("users")
    .select("*")
    .eq("github_id", githubId)
    .single()) as { data: any; error: any };

  if (error || !data) return null;

  return {
    id: data.id,
    githubId: data.github_id,
    githubUsername: data.github_username,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    stripeCustomerId: data.stripe_customer_id,
    subscriptionTier: data.subscription_tier || "free",
    subscriptionStatus: data.subscription_status || "none",
    trialStartedAt: data.trial_started_at,
    createdAt: data.created_at,
  };
}

export async function getUserContext(
  userId: string,
  skillSlug: string
): Promise<string | null> {
  const supabase = getClient();
  const { data } = (await supabase
    .from("user_contexts")
    .select("context_markdown")
    .eq("user_id", userId)
    .eq("skill_slug", skillSlug)
    .single()) as { data: any };

  return data?.context_markdown || null;
}
