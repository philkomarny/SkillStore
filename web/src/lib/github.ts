import fs from "fs/promises";
import path from "path";

const REPO_OWNER = "philkomarny";
const REPO_NAME = "SkillStore";
const BRANCH = "main";

const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// Root of the SkillStore repo (parent of web/)
const REPO_ROOT = path.resolve(process.cwd(), "..");

/**
 * Read marketplace.json — GitHub API first, local filesystem fallback for dev.
 */
export async function getMarketplaceJson() {
  // Try GitHub raw content first (works on Vercel and anywhere with network)
  try {
    const res = await fetch(`${RAW_BASE}/.claude-plugin/marketplace.json`, {
      next: { revalidate: 60 },
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
