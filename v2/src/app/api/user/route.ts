import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  return NextResponse.json({ profile });
}
