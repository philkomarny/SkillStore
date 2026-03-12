import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listContexts } from "@/lib/context-store";

/**
 * GET /api/context/profiles — List all context profiles for the authenticated user.
 * Backed by Lambda list-contexts (S3). (#18, #38)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profiles = await listContexts(session.user.id);
    return NextResponse.json({ profiles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
