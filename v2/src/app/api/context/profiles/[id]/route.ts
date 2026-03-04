import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";

/**
 * GET /api/context/profiles/[id] — Get a single context profile with its files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const supabase = getClient();

  const { data: contextProfile, error } = (await supabase
    .from("context_profiles")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .single()) as { data: any; error: any };

  if (error || !contextProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Also fetch associated files
  const { data: files } = (await supabase
    .from("context_files")
    .select("id, file_name, file_type, file_size_bytes, processed, created_at")
    .eq("context_profile_id", params.id)
    .order("created_at", { ascending: false })) as { data: any[] | null };

  return NextResponse.json({ profile: contextProfile, files: files || [] });
}

/**
 * PUT /api/context/profiles/[id] — Update a context profile
 * Body: { name?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const supabase = getClient();

  // Verify ownership
  const { data: existing } = (await supabase
    .from("context_profiles")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .single()) as { data: any };

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updates.name = body.name.trim();

  const { error } = await (supabase
    .from("context_profiles") as any)
    .update(updates)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/context/profiles/[id] — Delete a context profile and its files
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const supabase = getClient();

  // Verify ownership
  const { data: existing } = (await supabase
    .from("context_profiles")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .single()) as { data: any };

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Get files for storage cleanup
  const { data: files } = (await supabase
    .from("context_files")
    .select("storage_path")
    .eq("context_profile_id", params.id)) as { data: any[] | null };

  // Delete files from storage
  if (files && files.length > 0) {
    const paths = files.map((f: any) => f.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from("context-uploads").remove(paths);
    }
  }

  // Delete profile (cascades to context_files via FK)
  await supabase
    .from("context_profiles")
    .delete()
    .eq("id", params.id);

  return NextResponse.json({ success: true });
}
