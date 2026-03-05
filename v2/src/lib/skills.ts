import matter from "gray-matter";
import { getMarketplaceJson, getSkillContent } from "./github";
import { getUserContext } from "./users";
import { supabase } from "./supabase";
import type { Marketplace, SkillEntry, SkillDetail } from "./types";

function deriveSlug(entry: Omit<SkillEntry, "slug">): string {
  // Derive slug from source path: "skills/marketing-communications/campaign-strategy/SKILL.md" → "campaign-strategy"
  const parts = entry.source.split("/");
  // Use the folder name before SKILL.md, or slugify the name
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return entry.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getAllSkills(): Promise<SkillEntry[]> {
  const marketplace: Marketplace = await getMarketplaceJson();
  return marketplace.skills.map((s) => ({
    ...s,
    slug: (s as any).slug || deriveSlug(s),
  }));
}

export async function getSkillsByCategory(
  category: string
): Promise<SkillEntry[]> {
  const skills = await getAllSkills();
  return skills.filter((s) => s.category === category);
}

export async function getSkillDetail(
  slug: string,
  userId?: string | null
): Promise<SkillDetail | null> {
  const skills = await getAllSkills();
  const entry = skills.find((s) => s.slug === slug);

  if (!entry) return null;

  const [raw, contextContent, dbSkill] = await Promise.all([
    getSkillContent(entry.source),
    userId ? getUserContext(userId, slug) : Promise.resolve(null),
    Promise.resolve(supabase.from("skills").select("download_count, vouch_count, verification_level, submitted_by").eq("slug", slug).single()).then((r: any) => r.data).catch(() => null),
  ]);

  const { data, content } = matter(raw);

  return {
    ...entry,
    downloadCount: dbSkill?.download_count ?? 0,
    vouchCount: dbSkill?.vouch_count ?? entry.vouchCount ?? 0,
    verificationLevel: dbSkill?.verification_level ?? entry.verificationLevel ?? 0,
    submittedBy: dbSkill?.submitted_by ?? entry.submittedBy,
    content,
    rawContent: raw,
    contextContent,
    frontmatter: {
      name: data.name || entry.name,
      description: data.description || entry.description,
      version: data.version || entry.version,
      category: data.category || entry.category,
      tags: data.tags || entry.tags,
    },
  };
}

export async function getCategories(): Promise<
  { id: string; count: number }[]
> {
  const skills = await getAllSkills();
  const counts: Record<string, number> = {};

  for (const skill of skills) {
    counts[skill.category] = (counts[skill.category] || 0) + 1;
  }

  return Object.entries(counts).map(([id, count]) => ({ id, count }));
}

export function searchSkills(
  skills: SkillEntry[],
  query: string
): SkillEntry[] {
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
