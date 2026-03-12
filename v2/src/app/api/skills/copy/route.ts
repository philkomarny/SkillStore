import { NextResponse } from "next/server";
import { auth } from "@/auth";
// [USER-SKILL-STORE] replaced — https://github.com/philkomarny/SkillStore/issues/30
import { copyUserSkill } from "@/lib/user-skill-store";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { skillSlug } = await req.json();
  if (!skillSlug) {
    return NextResponse.json({ error: "skillSlug required" }, { status: 400 });
  }

  try {
    const result = await copyUserSkill(skillSlug, session.user.id);
    return NextResponse.json({
      userSkill: { slug: result.slug, version: result.version },
      alreadyExists: result.already_exists,
    });
  } catch (err: any) {
    console.error("Copy skill error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to copy skill" }, { status: 500 });
  }
}
