import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
// [DOCUMENT-STORE] replaced — remove comment block to roll back to Supabase signed-URL flow
import { uploadDocument } from "@/lib/document-store";

/**
 * POST /api/context/upload
 *
 * Accepts multipart/form-data with a single "file" field.
 * Proxies the file to the Lambda document store and returns { md5, status }.
 * The md5 is collected client-side and passed to POST /contexts at Build Context time.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // [DOCUMENT-STORE] replaced — remove comment block to roll back
    /*
    import { getUserProfile } from "@/lib/users";
    import { getClient } from "@/lib/supabase";

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = [...];
    const EXT_MAP = {...};

    // Two-mode flow: action = "sign" | "confirm"
    // sign  → Supabase createSignedUploadUrl → browser PUTs directly to storage
    // confirm → insert into context_files table
    */
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadDocument(buffer, file.name, file.type, session.user.id);
    return NextResponse.json(result);
    // [/DOCUMENT-STORE]
  } catch (err: any) {
    console.error("Upload route error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
