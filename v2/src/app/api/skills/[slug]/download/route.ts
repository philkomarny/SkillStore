import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data: skill } = (await supabase
    .from("skills")
    .select("id, download_count")
    .eq("slug", params.slug)
    .single()) as { data: any };

  if (!skill) {
    // Skill not yet in DB — insert with count of 1
    await (supabase.from("skills") as any).insert({
      slug: params.slug,
      source_path: `skills/${params.slug}/SKILL.md`,
      category: "unknown",
      download_count: 1,
    });
    return NextResponse.json({ downloadCount: 1 });
  }

  const newCount = (skill.download_count || 0) + 1;
  await (supabase.from("skills") as any)
    .update({ download_count: newCount })
    .eq("id", skill.id);

  return NextResponse.json({ downloadCount: newCount });
}
