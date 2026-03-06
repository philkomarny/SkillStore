import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClient } from "@/lib/supabase";

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

const REVIEW_PROMPT = `You are a skill quality reviewer for an enterprise higher education catalog.
Review the following skill submission and respond ONLY with valid JSON in this exact format:
{"result": "pass", "reasons": ["reason1"], "score": 85}
or
{"result": "fail", "reasons": ["reason1", "reason2"], "score": 20}

Evaluate against these criteria:
1. Higher-education relevance (is this genuinely useful to a college/university?)
2. Content quality (clear role statement, structured process, specific outputs)
3. No harmful or malicious instructions
4. Not too generic (must be HE-specific, not a generic writing or coding task)

A score >= 60 passes. Be lenient on quality but strict on harm and HE relevance.

Skill content:
`;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getClient();
  const anthropic = getAnthropic();

  const { data: pending, error } = await (supabase
    .from("verification_queue")
    .select("id, skill_id, skills(slug, source_path, verification_report)")
    .eq("status", "pending")
    .limit(5)) as { data: any[] | null; error: any };

  if (error) {
    console.error("[review] queue fetch failed:", error);
    return NextResponse.json({ error: "Queue fetch failed" }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    console.log("[review] no pending items");
    return NextResponse.json({ processed: 0 });
  }

  console.log(`[review] processing ${pending.length} pending items`);

  const results: { slug: string; result: string; score: number }[] = [];

  for (const item of pending) {
    const skill = item.skills as any;
    const slug = skill?.slug;
    const sourcePath = skill?.source_path;

    // Mark as in_review to prevent double-processing
    await supabase
      .from("verification_queue")
      .update({ status: "in_review", updated_at: new Date().toISOString() })
      .eq("id", item.id);

    try {
      const { data: fileData } = await supabase.storage
        .from("refined-skills")
        .download(sourcePath);

      if (!fileData) {
        console.error(`[review] slug=${slug} content not found in storage`);
        await supabase
          .from("verification_queue")
          .update({ status: "rejected", bot_report: { error: "Content not found" }, updated_at: new Date().toISOString() })
          .eq("id", item.id);
        continue;
      }

      const content = await fileData.text();

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [{ role: "user", content: REVIEW_PROMPT + content }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const rawText = (textBlock as any)?.text || "{}";

      let verdict: { result: string; reasons: string[]; score: number };
      try {
        verdict = JSON.parse(rawText);
      } catch {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        verdict = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { result: "fail", reasons: ["Unable to parse review response"], score: 0 };
      }

      const passed = verdict.result === "pass" && (verdict.score ?? 0) >= 60;
      console.log(`[review] slug=${slug} result=${verdict.result} score=${verdict.score}`);

      // Merge submission metadata with review verdict in bot_report
      const existingSubmission = skill?.verification_report?.submission ?? {};
      const botReport = { submission: existingSubmission, review: verdict };

      if (passed) {
        await supabase
          .from("skills")
          .update({
            is_published: true,
            verification_level: 1,
            verified_at: new Date().toISOString(),
            verified_by: "bot",
            verification_report: botReport,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.skill_id);

        await supabase
          .from("verification_queue")
          .update({ status: "approved", bot_report: botReport, updated_at: new Date().toISOString() })
          .eq("id", item.id);
      } else {
        await supabase
          .from("verification_queue")
          .update({ status: "rejected", bot_report: botReport, updated_at: new Date().toISOString() })
          .eq("id", item.id);
      }

      results.push({ slug, result: passed ? "approved" : "rejected", score: verdict.score });
    } catch (err) {
      console.error(`[review] slug=${slug} error:`, err);
      // Reset to pending so it can be retried
      await supabase
        .from("verification_queue")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", item.id);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
