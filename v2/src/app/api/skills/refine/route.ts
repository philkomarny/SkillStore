import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSkill, updateUserSkill } from "@/lib/user-skill-store";
import { getContext } from "@/lib/context-store";
import { refineSkillWithContext } from "@/lib/context-processor";

// Allow up to 300s for Claude API call (Vercel Pro)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userSkillId, contextProfileId } = await req.json();
    if (!userSkillId || !contextProfileId) {
      return NextResponse.json(
        { error: "userSkillId and contextProfileId are required" },
        { status: 400 }
      );
    }

    // Fetch skill from Lambda/S3 (#39 — was Supabase, now Lambda)
    const userSkill = await getUserSkill(userSkillId, session.user.id);
    if (!userSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Fetch context from Lambda/S3 (#39)
    const contextProfile = await getContext(contextProfileId, session.user.id);
    if (!contextProfile) {
      return NextResponse.json({ error: "Context profile not found" }, { status: 404 });
    }

    if (contextProfile.status !== "ready" || !contextProfile.context_markdown) {
      return NextResponse.json(
        { error: "Context profile is not ready. Build it first by uploading documents." },
        { status: 400 }
      );
    }

    const currentContent = userSkill.content;
    if (!currentContent) {
      return NextResponse.json({ error: "No skill content found" }, { status: 400 });
    }

    // Call the AI refinement engine with pre-built context markdown
    const { refinedContent, contextSummary } = await refineSkillWithContext(
      currentContent,
      userSkill.name,
      contextProfile.context_markdown
    );

    // Store new version via Lambda/S3 (#39)
    const newVersion = (userSkill.version || 1) + 1;
    await updateUserSkill(
      userSkillId,
      session.user.id,
      refinedContent,
      newVersion,
      "refined",
      contextSummary
    );

    return NextResponse.json({
      refinedContent,
      contextSummary,
      version: newVersion,
    });
  } catch (err: any) {
    console.error("Refinement error:", err?.message || err);
    const message = err?.message || "Unknown error";
    return NextResponse.json(
      { error: `Refinement failed: ${message}` },
      { status: 500 }
    );
  }
}
