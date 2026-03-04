import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get internal UUID from profile (session.user.id is Google ID, not the DB UUID)
  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const skillSlug = formData.get("skillSlug") as string;
  const file = formData.get("file") as File;

  if (!skillSlug || !file) {
    return NextResponse.json({ error: "Missing skillSlug or file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const supabase = getClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${profile.id}/${skillSlug}/${Date.now()}-${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("context-uploads")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // Record in context_files table
  const { data: record, error: dbError } = (await (supabase
    .from("context_files") as any)
    .insert({
      user_id: profile.id,
      skill_slug: skillSlug,
      file_name: file.name,
      file_type: file.type,
      storage_path: storagePath,
      file_size_bytes: file.size,
      processed: false,
    })
    .select()
    .single()) as { data: any; error: any };

  if (dbError) {
    console.error("DB error:", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ file: record });
}
