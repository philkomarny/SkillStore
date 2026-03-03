import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getEnterpriseConfigForUser,
  setEnterpriseConfigForUser,
  deleteEnterpriseConfigForUser,
} from "@/lib/supabase";

/**
 * GET /api/enterprise — check if enterprise context is configured for the current user
 */
export async function GET() {
  const session = await auth();
  if (!session?.githubId) {
    return NextResponse.json({ configured: false, authenticated: false });
  }

  const config = await getEnterpriseConfigForUser(session.githubId);
  if (config) {
    return NextResponse.json({
      configured: true,
      authenticated: true,
      owner: config.contextRepoOwner,
      repo: config.contextRepoName,
    });
  }
  return NextResponse.json({ configured: false, authenticated: true });
}

/**
 * POST /api/enterprise — connect an enterprise context repo
 * Body: { owner: string, repo: string }
 * Token comes from the OAuth session automatically.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.githubId || !session?.accessToken) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  let body: { owner?: string; repo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { owner, repo } = body;
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing required fields: owner, repo" },
      { status: 400 }
    );
  }

  // Verify the user has access to the repo using their OAuth token
  try {
    const testUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await fetch(testUrl, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (!res.ok) {
      const status = res.status;
      if (status === 404) {
        return NextResponse.json(
          {
            error:
              "Repository not found. Check the owner and repo name, and ensure your GitHub account has access.",
          },
          { status: 400 }
        );
      }
      if (status === 401) {
        return NextResponse.json(
          { error: "GitHub token expired. Please sign out and sign back in." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `GitHub returned ${status}. Check your credentials.` },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not reach GitHub. Try again." },
      { status: 502 }
    );
  }

  await setEnterpriseConfigForUser(
    session.githubId,
    session.githubUsername,
    owner,
    repo
  );

  return NextResponse.json({
    configured: true,
    owner,
    repo,
  });
}

/**
 * DELETE /api/enterprise — disconnect enterprise context
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.githubId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  await deleteEnterpriseConfigForUser(session.githubId);
  return NextResponse.json({ configured: false });
}
