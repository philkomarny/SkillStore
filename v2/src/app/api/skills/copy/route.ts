import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSkillDetail } from "@/lib/skills";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { skillSlug } = await req.json();
  if (!skillSlug) {
    return NextResponse.json({ error: "skillSlug required" }, { status: 400 });
  }

  // Get the user's internal DB id
  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if user already has this skill
  const supabase = getClient();
  const { data: existing } = (await supabase
    .from("user_skills")
    .select("id")
    .eq("user_id", profile.id)
    .eq("base_skill_slug", skillSlug)
    .single()) as { data: any };

  if (existing) {
    return NextResponse.json({
      userSkill: existing,
      alreadyExists: true,
    });
  }

  // Fetch the original skill from marketplace
  const skill = await getSkillDetail(skillSlug);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  // Store the raw skill content in Supabase storage
  const storagePath = `${profile.id}/${skillSlug}/v1.md`;

  const { error: storageError } = await supabase.storage
    .from("refined-skills")
    .upload(storagePath, skill.rawContent, {
      contentType: "text/markdown",
      upsert: true,
    });

  if (storageError) {
    console.error("Storage upload error:", storageError);
    return NextResponse.json(
      { error: "Failed to store skill content" },
      { status: 500 }
    );
  }

  // Insert user_skills record
  const { data: userSkill, error: insertError } = (await supabase
    .from("user_skills")
    .insert({
      user_id: profile.id,
      base_skill_slug: skillSlug,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      tags: skill.tags,
      version: 1,
      status: "draft",
      storage_path: storagePath,
    })
    .select()
    .single()) as { data: any; error: any };

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to create user skill" },
      { status: 500 }
    );
  }

  return NextResponse.json({ userSkill, alreadyExists: false });
}
