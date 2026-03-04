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

/** Sanitize filename for Supabase storage — remove spaces and special chars */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\s+/g, "-")           // spaces → hyphens
    .replace(/[^a-zA-Z0-9._-]/g, "") // strip everything except alphanumeric, dots, hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)` }, { status: 400 });
    }

    // Determine content type — trust the browser but fallback by extension
    let contentType = file.type;
    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      // Try to infer from file extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      const extMap: Record<string, string> = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain",
        md: "text/markdown",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      contentType = extMap[ext || ""] || contentType;
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"} (${file.name})` },
        { status: 400 }
      );
    }

    const supabase = getClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${profile.id}/${skillSlug}/${Date.now()}-${safeName}`;

    console.log("Upload attempt:", {
      originalName: file.name,
      safeName,
      storagePath,
      contentType,
      size: file.size,
      bufferLength: buffer.length,
    });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("context-uploads")
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", JSON.stringify(uploadError));
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Record in context_files table
    const { data: record, error: dbError } = (await (supabase
      .from("context_files") as any)
      .insert({
        user_id: profile.id,
        skill_slug: skillSlug,
        file_name: file.name,
        file_type: contentType,
        storage_path: storagePath,
        file_size_bytes: file.size,
        processed: false,
      })
      .select()
      .single()) as { data: any; error: any };

    if (dbError) {
      console.error("DB error:", JSON.stringify(dbError));
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ file: record });
  } catch (err: any) {
    console.error("Upload route error:", err?.message || err);
    return NextResponse.json(
      { error: `Server error: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
