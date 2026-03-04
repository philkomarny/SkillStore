import { createClient } from "@supabase/supabase-js";

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

export { getClient };

// Lazy singleton for server-side usage
let _supabase: ReturnType<typeof createClient> | null = null;
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      }
      _supabase = createClient(url, key);
    }
    return (_supabase as any)[prop];
  },
});

/*
-- SkillStore v2 Database Schema
-- Run this SQL in Supabase SQL Editor to create all tables

create table users (
  id uuid primary key default gen_random_uuid(),
  github_id text unique not null,
  github_username text not null,
  email text,
  display_name text,
  avatar_url text,
  stripe_customer_id text unique,
  subscription_tier text check (subscription_tier in ('free', 'level1', 'level2', 'level3')) default 'free',
  subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'none')) default 'none',
  trial_started_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_users_github_id on users (github_id);
create index idx_users_stripe_customer_id on users (stripe_customer_id);

create table skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  source_path text not null,
  category text not null,
  verification_level int default 0,
  verification_report jsonb,
  verified_at timestamptz,
  verified_by text,
  submitted_by text,
  download_count int default 0,
  vouch_count int default 0,
  is_featured boolean default false,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_skills_slug on skills (slug);
create index idx_skills_category on skills (category);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  stripe_payment_intent_id text,
  amount_cents int not null default 99,
  status text check (status in ('pending', 'completed', 'refunded')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, skill_id)
);
create index idx_purchases_user_id on purchases (user_id);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  stripe_subscription_id text unique,
  plan text not null default 'level2',
  status text check (status in ('active', 'trialing', 'past_due', 'canceled')) default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_subscriptions_user_id on subscriptions (user_id);
create index idx_subscriptions_stripe_id on subscriptions (stripe_subscription_id);

create table context_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  skill_slug text not null,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  file_size_bytes int,
  processed boolean default false,
  created_at timestamptz default now()
);
create index idx_context_files_user_skill on context_files (user_id, skill_slug);

create table user_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  skill_slug text not null,
  context_markdown text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, skill_slug)
);
create index idx_user_contexts_user_skill on user_contexts (user_id, skill_slug);

create table vouches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, skill_id)
);
create index idx_vouches_skill_id on vouches (skill_id);

create table verification_queue (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references skills(id) on delete cascade,
  requested_by text,
  status text check (status in ('pending', 'in_review', 'approved', 'rejected')) default 'pending',
  reviewer text,
  bot_report jsonb,
  reviewer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_verification_queue_status on verification_queue (status);

-- Storage bucket for context file uploads
-- Create via Supabase Dashboard: Storage > New Bucket
-- Name: context-uploads
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/png, image/jpeg, text/plain, text/markdown,
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document
*/
