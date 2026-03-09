import type { SkillEntry } from "./types";

const ENDPOINTS = {
  listSkills: "https://p302y68q3d.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_skills_get",
  getSkillContent: "https://wqechxpkgb.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_skill_content_get",
  addSkillContent: "https://nm260lbj42.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_skill_content_post",
  updateSkillContent: "https://eyq3dgqjs3.execute-api.us-west-2.amazonaws.com/prod/esm_live_update_skill_content_post",
};

export async function listSkills(): Promise<SkillEntry[]> {
  const res = await fetch(ENDPOINTS.listSkills, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`listSkills failed: ${res.status}`);
  const data = await res.json();
  const items: any[] = Array.isArray(data) ? data : (data.skills ?? []);
  return items.map((s) => ({
    slug: s.slug,
    name: s.name,
    source: s.slug, // sentinel — content fetched by slug, not path
    description: s.description ?? "",
    version: s.version ?? "1.0.0",
    category: s.category,
    tags: s.tags ?? [],
    verificationLevel: s.verificationLevel ?? 0,
  }));
}

export async function getSkillContent(slug: string): Promise<string> {
  const url = `${ENDPOINTS.getSkillContent}?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`getSkillContent failed for "${slug}": ${res.status}`);
  return res.text();
}

export async function addSkillContent(
  slug: string,
  content: string,
  meta: { name: string; description: string; category: string; tags: string[] },
  authorId: string
): Promise<void> {
  const res = await fetch(ENDPOINTS.addSkillContent, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      content,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      tags: meta.tags,
      author_id: authorId,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`addSkillContent failed for "${slug}": ${res.status} ${body}`);
  }
}

export async function updateSkillContent(
  slug: string,
  content: string,
  by: string
): Promise<void> {
  const res = await fetch(ENDPOINTS.updateSkillContent, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, content, by }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`updateSkillContent failed for "${slug}": ${res.status} ${body}`);
  }
}
