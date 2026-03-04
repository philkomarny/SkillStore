import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
import { extractText, generateContext, compressImageForClaude } from "@/lib/context-processor";

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
  const { contextProfileId } = await request.json();
  if (!contextProfileId) {
    return NextResponse.json({ error: "Missing contextProfileId" }, { status: 400 });
  }

  // Verify profile ownership
  const { data: contextProfile, error: profileError } = (await supabase
    .from("context_profiles")
    .select("*")
    .eq("id", contextProfileId)
    .eq("user_id", profile.id)
    .single()) as { data: any; error: any };

  if (profileError || !contextProfile) {
    return NextResponse.json({ error: "Context profile not found" }, { status: 404 });
  }

  // Mark as building
  await (supabase.from("context_profiles") as any)
    .update({ status: "building", updated_at: new Date().toISOString() })
    .eq("id", contextProfileId);

  // Get unprocessed files for this context profile
  const { data: files } = (await supabase
    .from("context_files")
    .select("*")
    .eq("context_profile_id", contextProfileId)
    .eq("processed", false)) as { data: any[] | null };

  if (!files || files.length === 0) {
    // Reset status
    await (supabase.from("context_profiles") as any)
      .update({ status: contextProfile.status || "draft", updated_at: new Date().toISOString() })
      .eq("id", contextProfileId);
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
    try {
      const { data: fileData } = await supabase.storage
        .from("context-uploads")
        .download(file.storage_path);

      if (!fileData) continue;

      const buffer = Buffer.from(await fileData.arrayBuffer());

      if (file.file_type.startsWith("image/")) {
        const { data: imgBase64, mediaType } = await compressImageForClaude(buffer, file.file_type);
        processedFiles.push({
          name: file.file_name,
          text: "",
          mimeType: mediaType,
          base64: imgBase64,
        });
      } else if (file.file_type === "application/pdf") {
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
      processedFiles.push({
        name: file.file_name,
        text: `[Error extracting text from ${file.file_name}]`,
        mimeType: file.file_type,
      });
    }
  }

  if (processedFiles.length === 0) {
    await (supabase.from("context_profiles") as any)
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("id", contextProfileId);
    return NextResponse.json({ error: "Could not process any files" }, { status: 400 });
  }

  // Generate context with Claude
  const contextMarkdown = await generateContext(
    contextProfile.name,
    processedFiles
  );

  // Update context_profiles with generated markdown
  const newVersion = (contextProfile.version || 1) + (contextProfile.context_markdown ? 1 : 0);
  await (supabase.from("context_profiles") as any)
    .update({
      context_markdown: contextMarkdown,
      status: "ready",
      version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contextProfileId);

  // Mark files as processed
  const fileIds = files.map((f: any) => f.id);
  await (supabase
    .from("context_files") as any)
    .update({ processed: true })
    .in("id", fileIds);

  return NextResponse.json({ context: contextMarkdown, version: newVersion });
}
