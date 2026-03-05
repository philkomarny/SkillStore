import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAllSkills } from "@/lib/skills";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data: skill } = (await supabase
    .from("skills")
    .select("vouch_count")
    .eq("slug", params.slug)
    .single()) as { data: any };

  return NextResponse.json({ clapCount: skill?.vouch_count || 0 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json().catch(() => ({}));
  const amount = Math.min(Math.max(parseInt(body.amount) || 1, 1), 50);

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

  const newCount = (skill.vouch_count || 0) + amount;
  await (supabase.from("skills") as any)
    .update({ vouch_count: newCount })
    .eq("id", skill.id);

  return NextResponse.json({ ok: true });
}
