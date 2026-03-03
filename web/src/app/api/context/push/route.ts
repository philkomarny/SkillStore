import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEnterpriseConfigForUser } from "@/lib/supabase";

/**
 * POST /api/context/push — push a context.md file to the user's enterprise repo
 * Body: { dept: string, skillName: string, content: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.githubId || !session?.accessToken) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  // Get enterprise config
  const config = await getEnterpriseConfigForUser(session.githubId);
  if (!config) {
    return NextResponse.json(
      { error: "No enterprise context repo configured. Go to /enterprise to set one up." },
      { status: 400 }
    );
  }

  let body: { dept?: string; skillName?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { dept, skillName, content } = body;
  if (!dept || !skillName || !content) {
    return NextResponse.json(
      { error: "Missing required fields: dept, skillName, content" },
      { status: 400 }
    );
  }

  const filePath = `${dept}/${skillName}/context.md`;
  const { contextRepoOwner: owner, contextRepoName: repo } = config;

  try {
    // Check if file already exists (need SHA for updates)
    let existingSha: string | undefined;
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      existingSha = existing.sha;
    }

    // Create or update the file via GitHub Contents API
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const putBody: Record<string, string> = {
      message: existingSha
        ? `Update context for ${dept}/${skillName}`
        : `Add context for ${dept}/${skillName}`,
      content: Buffer.from(content).toString("base64"),
    };
    if (existingSha) {
      putBody.sha = existingSha;
    }

    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const errorData = await putRes.json().catch(() => ({}));
      const msg =
        (errorData as { message?: string }).message ||
        `GitHub returned ${putRes.status}`;

      if (putRes.status === 404) {
        return NextResponse.json(
          {
            error: `Repository ${owner}/${repo} not found or no write access. Check your enterprise config.`,
          },
          { status: 400 }
        );
      }
      if (putRes.status === 401 || putRes.status === 403) {
        return NextResponse.json(
          {
            error:
              "No write access to this repository. Ensure your GitHub account has push permissions.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const result = await putRes.json();
    const htmlUrl = result.content?.html_url || null;

    return NextResponse.json({ success: true, htmlUrl });
  } catch {
    return NextResponse.json(
      { error: "Could not reach GitHub. Try again." },
      { status: 502 }
    );
  }
}
