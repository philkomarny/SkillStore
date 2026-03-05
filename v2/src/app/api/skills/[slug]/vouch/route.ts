import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { getAllSkills } from "@/lib/skills";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();

  // Get skill
  const { data: skill } = (await supabase
    .from("skills")
    .select("id, vouch_count")
    .eq("slug", params.slug)
    .single()) as { data: any };

  if (!skill) {
    return NextResponse.json({ vouchCount: 0, vouched: false });
  }

  let vouched = false;
  if (session?.user?.id) {
    const { data: vouch } = (await supabase
      .from("vouches")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("skill_id", skill.id)
      .single()) as { data: any };
    vouched = !!vouch;
  }

  return NextResponse.json({
    vouchCount: skill.vouch_count || 0,
    vouched,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or auto-create the skill row
  let { data: skill } = (await supabase
    .from("skills")
    .select("id, vouch_count")
    .eq("slug", params.slug)
    .single()) as { data: any };

  if (!skill) {
    const allSkills = await getAllSkills();
    const entry = allSkills.find((s) => s.slug === params.slug);
    const { data: created } = (await (supabase.from("skills") as any)
      .insert({
        slug: params.slug,
        source_path: entry?.source || `skills/${params.slug}/SKILL.md`,
        category: entry?.category || "unknown",
        vouch_count: 0,
      })
      .select("id, vouch_count")
      .single()) as { data: any };
    if (!created) {
      return NextResponse.json({ error: "Failed to initialize skill" }, { status: 500 });
    }
    skill = created;
  }

  // Check existing vouch
  const { data: existingVouch } = (await supabase
    .from("vouches")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("skill_id", skill.id)
    .single()) as { data: any };

  if (existingVouch) {
    // Remove vouch
    await (supabase.from("vouches") as any).delete().eq("id", existingVouch.id);
    const newCount = Math.max(0, (skill.vouch_count || 0) - 1);
    await (supabase.from("skills") as any).update({ vouch_count: newCount }).eq("id", skill.id);
    return NextResponse.json({ vouchCount: newCount, vouched: false });
  } else {
    // Add vouch
    await (supabase.from("vouches") as any).insert({
      user_id: session.user.id,
      skill_id: skill.id,
    });
    const newCount = (skill.vouch_count || 0) + 1;
    await (supabase.from("skills") as any).update({ vouch_count: newCount }).eq("id", skill.id);
    return NextResponse.json({ vouchCount: newCount, vouched: true });
  }
}
