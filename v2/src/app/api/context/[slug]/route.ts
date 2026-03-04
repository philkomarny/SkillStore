import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = (await supabase
    .from("user_contexts")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("skill_slug", params.slug)
    .single()) as { data: any };

  if (!data) {
    return NextResponse.json({ context: null });
  }

  return NextResponse.json({ context: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contextMarkdown } = await request.json();

  const { data: existing } = (await supabase
    .from("user_contexts")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("skill_slug", params.slug)
    .single()) as { data: any };

  if (existing) {
    await (supabase
      .from("user_contexts") as any)
      .update({
        context_markdown: contextMarkdown,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await (supabase.from("user_contexts") as any).insert({
      user_id: session.user.id,
      skill_slug: params.slug,
      context_markdown: contextMarkdown,
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("user_contexts")
    .delete()
    .eq("user_id", session.user.id)
    .eq("skill_slug", params.slug);

  // Also delete uploaded files
  await supabase
    .from("context_files")
    .delete()
    .eq("user_id", session.user.id)
    .eq("skill_slug", params.slug);

  return NextResponse.json({ success: true });
}
