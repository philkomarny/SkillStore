import { NextResponse } from "next/server";
import { getAllSkills, searchSkills } from "@/lib/skills";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  let skills = await getAllSkills();

  if (category) {
    skills = skills.filter((s) => s.category === category);
  }

  if (query) {
    skills = searchSkills(skills, query);
  }

  return NextResponse.json({ skills, total: skills.length });
}
