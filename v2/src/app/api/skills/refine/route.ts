import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
import { extractText, refineSkill } from "@/lib/context-processor";

// Allow up to 300s for PDF extraction + Claude API call (Vercel Pro)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userSkillId } = await req.json();
    if (!userSkillId) {
      return NextResponse.json({ error: "userSkillId required" }, { status: 400 });
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

    // Mark as refining
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
      return NextResponse.json({ error: "No skill content found" }, { status: 400 });
    }

    // Get unprocessed context files for this user + skill
    const { data: contextFiles } = (await supabase
      .from("context_files")
      .select("*")
      .eq("user_id", profile.id)
      .eq("skill_slug", userSkill.base_skill_slug)
      .eq("processed", false)) as { data: any[] | null };

    if (!contextFiles || contextFiles.length === 0) {
      // Reset status
      await (supabase.from("user_skills") as any)
        .update({ status: userSkill.status, updated_at: new Date().toISOString() })
        .eq("id", userSkillId);
      return NextResponse.json({ error: "No files to process. Upload documents first." }, { status: 400 });
    }

    // Download and extract text from each file
    const processedFiles: Array<{
      name: string;
      text: string;
      mimeType: string;
      base64?: string;
    }> = [];

    for (const file of contextFiles) {
      try {
        const { data: fileData } = await supabase.storage
          .from("context-uploads")
          .download(file.storage_path);

        if (!fileData) {
          console.error(`Failed to download file: ${file.storage_path}`);
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());

        if (file.file_type.startsWith("image/")) {
          processedFiles.push({
            name: file.file_name,
            text: "",
            mimeType: file.file_type,
            base64: buffer.toString("base64"),
          });
        } else {
          const text = await extractText(buffer, file.file_type, file.file_name);
          processedFiles.push({
            name: file.file_name,
            text,
            mimeType: file.file_type,
          });
        }
      } catch (fileErr: any) {
        console.error(`Error processing file ${file.file_name}:`, fileErr?.message || fileErr);
        // Continue with other files instead of crashing
        processedFiles.push({
          name: file.file_name,
          text: `[Error extracting text from ${file.file_name}]`,
          mimeType: file.file_type,
        });
      }
    }

    if (processedFiles.length === 0) {
      await (supabase.from("user_skills") as any)
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", userSkillId);
      return NextResponse.json({ error: "Could not process any uploaded files" }, { status: 400 });
    }

    // Call the AI refinement engine
    const { refinedContent, contextSummary } = await refineSkill(
      currentContent,
      userSkill.name,
      processedFiles
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", userSkillId);

    // Mark context files as processed
    const fileIds = contextFiles.map((f: any) => f.id);
    await (supabase.from("context_files") as any)
      .update({ processed: true })
      .in("id", fileIds);

    return NextResponse.json({
      refinedContent,
      contextSummary,
      version: newVersion,
    });
  } catch (err: any) {
    console.error("Refinement error:", err?.message || err);
    // Try to return a useful error message
    const message = err?.message || "Unknown error";
    return NextResponse.json(
      { error: `Refinement failed: ${message}` },
      { status: 500 }
    );
  }
}
