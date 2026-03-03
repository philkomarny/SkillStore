import fs from "fs/promises";
import path from "path";

const REPO_OWNER = process.env.SKILLSTORE_REPO_OWNER || "philkomarny";
const REPO_NAME = process.env.SKILLSTORE_REPO_NAME || "SkillStore";
const BRANCH = process.env.SKILLSTORE_BRANCH || "main";

const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// Root of the SkillStore repo (parent of web/)
const REPO_ROOT = path.resolve(process.cwd(), "..");

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Returns repo config for UI components to build dynamic links.
 */
export function getRepoConfig() {
  const isCustom = REPO_OWNER !== "philkomarny" || REPO_NAME !== "SkillStore";
  return {
    owner: REPO_OWNER,
    name: REPO_NAME,
    branch: BRANCH,
    isCustom,
    repoUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
    rawBase: RAW_BASE,
  };
}

/**
 * Read marketplace.json — GitHub API first, local filesystem fallback for dev.
 */
export async function getMarketplaceJson() {
  // Try GitHub raw content first (works on Vercel and anywhere with network)
  try {
    const res = await fetch(`${RAW_BASE}/.claude-plugin/marketplace.json`, {
      next: { revalidate: 60 },
      headers: authHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Network error — fall through to local
  }

  // Fallback to local filesystem (works in dev when repo is local)
  const localPath = path.join(REPO_ROOT, ".claude-plugin", "marketplace.json");
  const data = await fs.readFile(localPath, "utf-8");
  return JSON.parse(data);
}

/**
 * Read a SKILL.md file — GitHub first, local filesystem fallback.
 */
export async function getSkillContent(source: string): Promise<string> {
  try {
    const res = await fetch(`${RAW_BASE}/${source}`, {
      next: { revalidate: 60 },
      headers: authHeaders(),
    });
    if (res.ok) {
      return await res.text();
    }
  } catch {
    // Network error — fall through to local
  }

  const localPath = path.join(REPO_ROOT, source);
  return await fs.readFile(localPath, "utf-8");
}

/**
 * Read a context.md file that lives alongside a SKILL.md in the same repo.
 * Used for self-hosted forks where context lives in the skills repo.
 * Returns null if no context file exists.
 */
export async function getContextContent(
  skillSource: string
): Promise<string | null> {
  // skillSource is like "skills/enrollment/prospect-outreach/SKILL.md"
  // context.md lives in the same directory
  const dir = skillSource.replace(/\/[^/]+$/, "");
  const contextPath = `${dir}/context.md`;

  // Try GitHub first
  try {
    const res = await fetch(`${RAW_BASE}/${contextPath}`, {
      next: { revalidate: 60 },
      headers: authHeaders(),
    });
    if (res.ok) {
      return await res.text();
    }
  } catch {
    // Network error — fall through to local
  }

  // Fallback to local filesystem
  try {
    const localPath = path.join(REPO_ROOT, contextPath);
    return await fs.readFile(localPath, "utf-8");
  } catch {
    // No context file — that's fine
    return null;
  }
}

/**
 * Read a context.md from a separate enterprise context repo.
 * The enterprise repo mirrors the skill directory structure:
 *   skills/enrollment/prospect-outreach/SKILL.md → enrollment/prospect-outreach/context.md
 */
export async function getEnterpriseContextContent(
  skillSource: string,
  enterprise: { owner: string; repo: string; token: string }
): Promise<string | null> {
  // Strip "skills/" prefix and replace the filename with context.md
  const relativePath = skillSource.replace(/^skills\//, "").replace(/\/[^/]+$/, "");
  const contextPath = `${relativePath}/context.md`;
  const url = `https://raw.githubusercontent.com/${enterprise.owner}/${enterprise.repo}/main/${contextPath}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { Authorization: `Bearer ${enterprise.token}` },
    });
    if (res.ok) {
      return await res.text();
    }
  } catch {
    // No context for this skill — that's fine
  }

  return null;
}
