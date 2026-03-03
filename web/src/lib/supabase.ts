import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using service role key.
// Only import this in server components and API routes.
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

export interface EnterpriseConfigRow {
  id: string;
  github_user_id: string;
  github_username: string;
  context_repo_owner: string;
  context_repo_name: string;
  created_at: string;
  updated_at: string;
}

export async function getEnterpriseConfigForUser(
  githubUserId: string
): Promise<{ contextRepoOwner: string; contextRepoName: string } | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("enterprise_configs")
    .select("context_repo_owner, context_repo_name")
    .eq("github_user_id", githubUserId)
    .single();

  if (error || !data) return null;
  return {
    contextRepoOwner: data.context_repo_owner,
    contextRepoName: data.context_repo_name,
  };
}

export async function setEnterpriseConfigForUser(
  githubUserId: string,
  githubUsername: string,
  contextRepoOwner: string,
  contextRepoName: string
): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from("enterprise_configs").upsert(
    {
      github_user_id: githubUserId,
      github_username: githubUsername,
      context_repo_owner: contextRepoOwner,
      context_repo_name: contextRepoName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "github_user_id" }
  );

  if (error) throw new Error(`Failed to save config: ${error.message}`);
}

export async function deleteEnterpriseConfigForUser(
  githubUserId: string
): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase
    .from("enterprise_configs")
    .delete()
    .eq("github_user_id", githubUserId);

  if (error) throw new Error(`Failed to delete config: ${error.message}`);
}

/*
SQL to create the enterprise_configs table in Supabase:

create table enterprise_configs (
  id uuid primary key default gen_random_uuid(),
  github_user_id text unique not null,
  github_username text not null,
  context_repo_owner text not null,
  context_repo_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast lookup by github user
create index idx_enterprise_configs_github_user_id
  on enterprise_configs (github_user_id);
*/
