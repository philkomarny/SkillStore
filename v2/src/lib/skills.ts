import matter from "gray-matter";
import { listSkills as storeListSkills, getSkillContent as storeGetSkillContent } from "./skill-store";
import { getUserContext } from "./users";
import type { SkillEntry, SkillDetail } from "./types";

// [SKILL-STORE] replaced — uncomment below to roll back
/*
import { getMarketplaceJson, getSkillContent } from "./github";
import type { Marketplace, SkillEntry, SkillDetail } from "./types";

async function getCommunitySkills(): Promise<SkillEntry[]> {
  try {
    const { data } = await supabase
      .from("skills")
      .select("slug, source_path, category, verification_level, submitted_by, verification_report")
      .eq("is_published", true)
      .like("source_path", "submissions/%");
    if (!data) return [];
    return data.map((s: any) => ({
      slug: s.slug,
      name: s.verification_report?.submission?.name || s.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      source: s.source_path,
      description: s.verification_report?.submission?.description || "",
      version: "1.0.0",
      category: s.category,
      tags: s.verification_report?.submission?.tags || [],
      verificationLevel: s.verification_level,
      submittedBy: s.submitted_by,
    }));
  } catch {
    return [];
  }
}

async function getSkillContentFromStorage(path: string): Promise<string> {
  const { data } = await supabase.storage.from("refined-skills").download(path);
  if (!data) throw new Error(`Storage content not found: ${path}`);
  return data.text();
}

function deriveSlug(entry: Omit<SkillEntry, "slug">): string {
  const parts = entry.source.split("/");
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return entry.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
*/
// [/SKILL-STORE]

export async function getAllSkills(): Promise<SkillEntry[]> {
  return storeListSkills();
}

// [SKILL-STORE] replaced — uncomment below to roll back
/*
export async function getAllSkills(): Promise<SkillEntry[]> {
  const [marketplace, community] = await Promise.all([
    getMarketplaceJson(),
    getCommunitySkills(),
  ]);
  const official: SkillEntry[] = (marketplace as Marketplace).skills.map((s) => ({
    ...s,
    slug: (s as any).slug || deriveSlug(s),
  }));
  return [...official, ...community];
}
*/
// [/SKILL-STORE]

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

  // [SKILL-STORE] replaced — uncomment below to roll back
  /*
  const isCommunity = entry.source.startsWith("submissions/");
  const rawPromise = isCommunity ? getSkillContentFromStorage(entry.source) : getSkillContent(entry.source);
  */
  // [/SKILL-STORE]
  const [raw, contextContent] = await Promise.all([
    storeGetSkillContent(slug),
    userId ? getUserContext(userId, slug) : Promise.resolve(null),
  ]);

  const { data, content } = matter(raw);

  return {
    ...entry,
    downloadCount: 0,
    clapCount: 0,
    verificationLevel: entry.verificationLevel ?? 0,
    submittedBy: entry.submittedBy,
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
