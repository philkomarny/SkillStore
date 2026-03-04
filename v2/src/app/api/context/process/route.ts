import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
import { extractText, generateContext } from "@/lib/context-processor";

// Allow up to 300s for file processing + Claude API call (Vercel Pro)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const supabase = getClient();
  const { skillSlug, skillDescription } = await request.json();
  if (!skillSlug) {
    return NextResponse.json({ error: "Missing skillSlug" }, { status: 400 });
  }

  // Get unprocessed files for this user + skill
  const { data: files } = (await supabase
    .from("context_files")
    .select("*")
    .eq("user_id", profile.id)
    .eq("skill_slug", skillSlug)
    .eq("processed", false)) as { data: any[] | null };

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files to process" }, { status: 400 });
  }

  // Download and extract text from each file
  const processedFiles: Array<{
    name: string;
    text: string;
    mimeType: string;
    base64?: string;
  }> = [];

  for (const file of files) {
    const { data: fileData } = await supabase.storage
      .from("context-uploads")
      .download(file.storage_path);

    if (!fileData) continue;

    const buffer = Buffer.from(await fileData.arrayBuffer());

    if (file.file_type.startsWith("image/") || file.file_type === "application/pdf") {
      // Send images and PDFs as base64 — Claude reads them directly
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
  }

  // Generate context with Claude
  const contextMarkdown = await generateContext(
    skillDescription || skillSlug,
    processedFiles
  );

  // Upsert user_contexts
  const { data: existing } = (await supabase
    .from("user_contexts")
    .select("id")
    .eq("user_id", profile.id)
    .eq("skill_slug", skillSlug)
    .single()) as { data: any };

  if (existing) {
    await (supabase
      .from("user_contexts") as any)
      .update({ context_markdown: contextMarkdown, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await (supabase.from("user_contexts") as any).insert({
      user_id: profile.id,
      skill_slug: skillSlug,
      context_markdown: contextMarkdown,
    });
  }

  // Mark files as processed
  const fileIds = files.map((f: any) => f.id);
  await (supabase
    .from("context_files") as any)
    .update({ processed: true })
    .in("id", fileIds);

  return NextResponse.json({ context: contextMarkdown });
}
