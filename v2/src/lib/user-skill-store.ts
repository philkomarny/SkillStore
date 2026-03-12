/**
 * user-skill-store.ts — Lambda wrapper for user-skills Refinery CRUD.
 *
 * Related: https://github.com/philkomarny/SkillStore/issues/30
 */

const ENDPOINTS = {
  copy:   "https://6dhf9kowj6.execute-api.us-west-2.amazonaws.com/prod/esm_live_copy_user_skill_post",
  list:   "https://38gypl4b5l.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_user_skills_get",
  delete: "https://20t9eyz0he.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_user_skill_delete",
};

function assertUserId(userId: string): void {
  if (!userId || userId.length === 0) throw new Error("userId is required");
}

export async function copyUserSkill(
  slug: string,
  userId: string
): Promise<{ slug: string; version: number; already_exists: boolean }> {
  assertUserId(userId);
  console.log("[user-skill-store] copyUserSkill →", slug, "user:", userId);
  const res = await fetch(ENDPOINTS.copy, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, user_id: userId }),
  });
  if (!res.ok) throw new Error(`copyUserSkill failed: ${res.status}`);
  const data = await res.json();
  console.log("[user-skill-store] copyUserSkill ←", data);
  return data;
}

export async function listUserSkills(userId: string): Promise<any[]> {
  assertUserId(userId);
  console.log("[user-skill-store] listUserSkills → user:", userId);
  const res = await fetch(`${ENDPOINTS.list}?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`listUserSkills failed: ${res.status}`);
  const data = await res.json();
  const skills = Array.isArray(data.skills) ? data.skills : [];
  console.log("[user-skill-store] listUserSkills ←", skills.length, "skills");
  return skills;
}

export async function deleteUserSkill(slug: string, userId: string): Promise<void> {
  assertUserId(userId);
  console.log("[user-skill-store] deleteUserSkill →", slug, "user:", userId);
  const res = await fetch(
    `${ENDPOINTS.delete}?slug=${encodeURIComponent(slug)}&user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`deleteUserSkill failed: ${res.status}`);
}
