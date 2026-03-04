import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";

// GET — Fetch a single user skill with its content
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const supabase = getClient();
  const { data: userSkill, error } = (await supabase
    .from("user_skills")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .single()) as { data: any; error: any };

  if (error || !userSkill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  // Fetch the actual skill content from storage
  let content: string | null = null;
  if (userSkill.storage_path) {
    const { data: fileData } = await supabase.storage
      .from("refined-skills")
      .download(userSkill.storage_path);

    if (fileData) {
      content = await fileData.text();
    }
  }

  return NextResponse.json({ userSkill, content });
}

// PUT — Update user skill metadata (name, sharing, etc.)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const supabase = getClient();

  // Only allow updating specific fields
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.isShareable !== undefined) updates.is_shareable = body.isShareable;
  if (body.status !== undefined) updates.status = body.status;

  // If content is provided, store it as a new version
  if (body.content !== undefined) {
    // Get current version
    const { data: current } = (await supabase
      .from("user_skills")
      .select("version, base_skill_slug")
      .eq("id", params.id)
      .eq("user_id", profile.id)
      .single()) as { data: any };

    if (current) {
      const newVersion = (current.version || 1) + 1;
      const storagePath = `${profile.id}/${current.base_skill_slug}/v${newVersion}.md`;

      await supabase.storage
        .from("refined-skills")
        .upload(storagePath, body.content, {
          contentType: "text/markdown",
          upsert: true,
        });

      updates.version = newVersion;
      updates.storage_path = storagePath;
    }
  }

  const { data: updated, error } = (await supabase
    .from("user_skills")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .select()
    .single()) as { data: any; error: any };

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ userSkill: updated });
}

// DELETE — Remove a user skill
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const supabase = getClient();

  // Get skill details before deleting (for storage cleanup)
  const { data: skill } = (await supabase
    .from("user_skills")
    .select("base_skill_slug")
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .single()) as { data: any };

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  // Delete from storage (all versions)
  const { data: files } = await supabase.storage
    .from("refined-skills")
    .list(`${profile.id}/${skill.base_skill_slug}`);

  if (files && files.length > 0) {
    const paths = files.map(
      (f: any) => `${profile.id}/${skill.base_skill_slug}/${f.name}`
    );
    await supabase.storage.from("refined-skills").remove(paths);
  }

  // Delete the record
  const { error } = await supabase
    .from("user_skills")
    .delete()
    .eq("id", params.id)
    .eq("user_id", profile.id);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
