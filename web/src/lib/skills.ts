import matter from "gray-matter";
import { getMarketplaceJson, getSkillContent } from "./github";
import type { Marketplace, SkillEntry, SkillDetail } from "./types";

export async function getAllSkills(): Promise<SkillEntry[]> {
  const marketplace: Marketplace = await getMarketplaceJson();
  return marketplace.skills;
}

export async function getSkillsByDepartment(
  dept: string
): Promise<SkillEntry[]> {
  const skills = await getAllSkills();
  return skills.filter((s) => s.category === dept);
}

export async function getSkillDetail(
  dept: string,
  skillName: string
): Promise<SkillDetail | null> {
  const skills = await getAllSkills();
  const entry = skills.find(
    (s) => s.category === dept && s.name === skillName
  );

  if (!entry) return null;

  const raw = await getSkillContent(entry.source);
  const { data, content } = matter(raw);

  return {
    ...entry,
    content,
    rawContent: raw,
    frontmatter: {
      name: data.name || entry.name,
      description: data.description || entry.description,
      version: data.version || entry.version,
      category: data.category || entry.category,
      tags: data.tags || entry.tags,
    },
  };
}

export async function getDepartments(): Promise<
  { id: string; count: number }[]
> {
  const skills = await getAllSkills();
  const counts: Record<string, number> = {};

  for (const skill of skills) {
    counts[skill.category] = (counts[skill.category] || 0) + 1;
  }

  return Object.entries(counts).map(([id, count]) => ({ id, count }));
}

export function searchSkills(skills: SkillEntry[], query: string): SkillEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return skills;

  return skills.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
  );
}
