import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
// [CONTEXT-STORE] replaced — remove comment block to roll back
import { listContexts } from "@/lib/context-store";

/**
 * GET /api/context/profiles — List all context profiles for the authenticated user
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // [CONTEXT-STORE] replaced — remove comment block to roll back
  /*
  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const supabase = getClient();
  const { data: profiles, error } = (await supabase
    .from("context_profiles")
    .select("*")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })) as { data: any[] | null; error: any };
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profiles: profiles || [] });
  */
  try {
    const profiles = await listContexts(session.user.id);
    return NextResponse.json({ profiles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  // [/CONTEXT-STORE]
}

/**
 * POST /api/context/profiles — Create a new context profile (staging record for file upload)
 * Body: { name: string }
 *
 * NOTE: This Supabase record is still needed as a staging area for file uploads (#14 document
 * APIs not yet wired). Once document APIs land, this route will be replaced by createContext()
 * from context-store.ts, which calls POST /contexts with name + MD5 array. See #14, #18.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = getClient();
  const { data: contextProfile, error } = (await (supabase
    .from("context_profiles") as any)
    .insert({
      user_id: profile.id,
      name: name.trim(),
      status: "draft",
      version: 1,
    })
    .select()
    .single()) as { data: any; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: contextProfile });
}
