import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, category, tags, content } = await request.json();

  if (!name || !description || !category || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const tagList: string[] = Array.isArray(tags) ? tags : [];
  console.log(`[submit] slug=${slug} user=${session.user.id}`);

  const fileContent = [
    `---`,
    `name: "${name}"`,
    `description: "${description}"`,
    `metadata:`,
    `  version: 1.0.0`,
    `  category: ${category}`,
    `  tags: [${tagList.map((t) => `"${t}"`).join(", ")}]`,
    `---`,
    ``,
    content,
  ].join("\n");

  const storagePath = `submissions/${slug}.md`;
  const supabase = getClient();

  const { error: storageError } = await supabase.storage
    .from("refined-skills")
    .upload(storagePath, fileContent, { contentType: "text/markdown", upsert: true });

  if (storageError) {
    console.error(`[submit] storage upload failed:`, storageError);
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .insert({
      slug,
      source_path: storagePath,
      category,
      verification_level: 0,
      is_published: false,
      submitted_by: session.user.id,
      verification_report: { submission: { name, description, tags: tagList } },
    })
    .select("id")
    .single();

  if (skillError) {
    console.error(`[submit] skill insert failed:`, skillError);
    return NextResponse.json({ error: "Failed to save skill" }, { status: 500 });
  }

  const { error: queueError } = await supabase
    .from("verification_queue")
    .insert({ skill_id: skill.id, requested_by: session.user.id, status: "pending" });

  if (queueError) {
    console.error(`[submit] queue insert failed (non-fatal):`, queueError);
  }

  console.log(`[submit] slug=${slug} stored and queued for review`);
  return NextResponse.json({ success: true, message: "Skill submitted for review" });
}
