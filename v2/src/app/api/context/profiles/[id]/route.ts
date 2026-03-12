import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getContext, deleteContext } from "@/lib/context-store";

/**
 * GET /api/context/profiles/[id] — Get a single context profile with its documents.
 * Backed by Lambda get-context (S3). (#18, #38)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getContext(params.id, session.user.id);
    if (!ctx) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    return NextResponse.json({ profile: ctx, files: ctx.documents ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/context/profiles/[id] — Delete a context profile and its S3 objects.
 * Source documents are NOT affected.
 * Backed by Lambda delete-context (S3). (#18, #38)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteContext(params.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
