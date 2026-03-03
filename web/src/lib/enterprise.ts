import { auth } from "@/auth";
import { getEnterpriseConfigForUser } from "@/lib/supabase";

export interface EnterpriseConfig {
  owner: string;
  repo: string;
  token: string;
}

/**
 * Get enterprise config from the authenticated session + Supabase.
 * Call from server components and API routes.
 * Returns null if not authenticated or no enterprise config set.
 */
export async function getEnterpriseConfigFromSession(): Promise<EnterpriseConfig | null> {
  try {
    const session = await auth();
    if (!session?.githubId || !session?.accessToken) return null;

    const config = await getEnterpriseConfigForUser(session.githubId);
    if (!config) return null;

    return {
      owner: config.contextRepoOwner,
      repo: config.contextRepoName,
      token: session.accessToken,
    };
  } catch {
    return null;
  }
}
