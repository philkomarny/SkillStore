import { NextResponse } from "next/server";
import { auth } from "@/auth";
// [USER-SKILL-STORE] replaced — https://github.com/philkomarny/SkillStore/issues/30
// GET and PUT still on Supabase until get/update Lambdas exist.
import { deleteUserSkill } from "@/lib/user-skill-store";

// DELETE — Remove a user skill via Lambda
// params.id is the skill slug (was Supabase UUID before #30)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const slug = params.id;

  try {
    await deleteUserSkill(slug, session.user.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete user skill error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Delete failed" }, { status: 500 });
  }
}
