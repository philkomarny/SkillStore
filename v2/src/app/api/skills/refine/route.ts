import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
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

    const profile = await getUserProfile(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = getClient();

    // Fetch the user_skill record
    const { data: userSkill, error: skillError } = (await supabase
      .from("user_skills")
      .select("*")
      .eq("id", userSkillId)
      .eq("user_id", profile.id)
      .single()) as { data: any; error: any };

    if (skillError || !userSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Fetch the context profile
    const { data: contextProfile, error: ctxError } = (await supabase
      .from("context_profiles")
      .select("*")
      .eq("id", contextProfileId)
      .eq("user_id", profile.id)
      .single()) as { data: any; error: any };

    if (ctxError || !contextProfile) {
      return NextResponse.json({ error: "Context profile not found" }, { status: 404 });
    }

    if (contextProfile.status !== "ready" || !contextProfile.context_markdown) {
      return NextResponse.json(
        { error: "Context profile is not ready. Build it first by uploading documents." },
        { status: 400 }
      );
    }

    // Mark skill as refining
    await (supabase.from("user_skills") as any)
      .update({ status: "refining", updated_at: new Date().toISOString() })
      .eq("id", userSkillId);

    // Get current skill content from storage
    let currentContent = "";
    if (userSkill.storage_path) {
      const { data: fileData } = await supabase.storage
        .from("refined-skills")
        .download(userSkill.storage_path);
      if (fileData) {
        currentContent = await fileData.text();
      }
    }

    if (!currentContent) {
      await (supabase.from("user_skills") as any)
        .update({ status: userSkill.status, updated_at: new Date().toISOString() })
        .eq("id", userSkillId);
      return NextResponse.json({ error: "No skill content found" }, { status: 400 });
    }

    // Call the AI refinement engine with pre-built context markdown
    const { refinedContent, contextSummary } = await refineSkillWithContext(
      currentContent,
      userSkill.name,
      contextProfile.context_markdown
    );

    // Store new version in storage
    const newVersion = (userSkill.version || 1) + 1;
    const storagePath = `${profile.id}/${userSkill.base_skill_slug}/v${newVersion}.md`;

    const { error: storageError } = await supabase.storage
      .from("refined-skills")
      .upload(storagePath, refinedContent, {
        contentType: "text/markdown",
        upsert: true,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      await (supabase.from("user_skills") as any)
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", userSkillId);
      return NextResponse.json({ error: "Failed to store refined skill" }, { status: 500 });
    }

    // Update user_skills record
    await (supabase.from("user_skills") as any)
      .update({
        version: newVersion,
        status: "refined",
        storage_path: storagePath,
        context_summary: contextSummary,
        last_context_profile_id: contextProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userSkillId);

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
