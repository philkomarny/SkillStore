import { getClient } from "./supabase";
import type { UserProfile } from "./types";

export async function upsertUser(data: {
  googleId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<void> {
  const supabase = getClient();
  await (supabase.from("users") as any).upsert(
    {
      google_id: data.googleId,
      email: data.email || null,
      display_name: data.displayName || null,
      avatar_url: data.avatarUrl || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "google_id" }
  );
}

export async function getUserProfile(
  googleId: string
): Promise<UserProfile | null> {
  const supabase = getClient();
  const { data, error } = (await supabase
    .from("users")
    .select("*")
    .eq("google_id", googleId)
    .single()) as { data: any; error: any };

  if (error || !data) return null;

  return {
    id: data.id,
    googleId: data.google_id,
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
