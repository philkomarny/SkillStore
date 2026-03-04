import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, category, content } = await request.json();

  if (!name || !description || !category || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // In a full implementation, this would create a GitHub PR
  // For now, store submission metadata
  // TODO: Create PR via GitHub API with user's OAuth token

  return NextResponse.json({
    success: true,
    message: "Skill submitted for review",
  });
}
