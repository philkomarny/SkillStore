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

const EXT_MAP: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Sanitize filename for Supabase storage — remove spaces and special chars */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function resolveContentType(fileName: string, browserType: string): string {
  if (browserType && ALLOWED_TYPES.includes(browserType)) return browserType;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return EXT_MAP[ext] || browserType;
}

/**
 * POST /api/context/upload
 *
 * Two modes:
 *  1) action = "sign"    → returns a signed upload URL (file goes directly to Supabase)
 *  2) action = "confirm" → records the completed upload in context_files table
 *
 * This avoids Vercel's 4.5MB body limit by never routing the file through the function.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getUserProfile(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    const supabase = getClient();

    // ── Step 1: Generate signed upload URL ──────────────────────────────
    if (action === "sign") {
      const { skillSlug, fileName, fileType, fileSize } = body;

      if (!skillSlug || !fileName) {
        return NextResponse.json({ error: "Missing skillSlug or fileName" }, { status: 400 });
      }

      if (fileSize && fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB (max 10MB)` },
          { status: 400 }
        );
      }

      const contentType = resolveContentType(fileName, fileType);
      if (!ALLOWED_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${fileType || "unknown"} (${fileName})` },
          { status: 400 }
        );
      }

      const safeName = sanitizeFileName(fileName);
      const storagePath = `${profile.id}/${skillSlug}/${Date.now()}-${safeName}`;

      const { data, error } = await supabase.storage
        .from("context-uploads")
        .createSignedUploadUrl(storagePath);

      if (error) {
        console.error("Signed URL error:", JSON.stringify(error));
        return NextResponse.json(
          { error: `Could not create upload URL: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        signedUrl: data.signedUrl,
        token: data.token,
        storagePath,
        contentType,
      });
    }

    // ── Step 2: Confirm upload → record in DB ───────────────────────────
    if (action === "confirm") {
      const { skillSlug, fileName, fileType, fileSize, storagePath } = body;

      if (!skillSlug || !fileName || !storagePath) {
        return NextResponse.json(
          { error: "Missing skillSlug, fileName, or storagePath" },
          { status: 400 }
        );
      }

      const contentType = resolveContentType(fileName, fileType);

      const { data: record, error: dbError } = (await (supabase
        .from("context_files") as any)
        .insert({
          user_id: profile.id,
          skill_slug: skillSlug,
          file_name: fileName,
          file_type: contentType,
          storage_path: storagePath,
          file_size_bytes: fileSize || 0,
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
    }

    return NextResponse.json({ error: "Invalid action. Use 'sign' or 'confirm'." }, { status: 400 });
  } catch (err: any) {
    console.error("Upload route error:", err?.message || err);
    return NextResponse.json(
      { error: `Server error: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
