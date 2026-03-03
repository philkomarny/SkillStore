import fs from "fs/promises";
import path from "path";

const REPO_OWNER = "philkomarny";
const REPO_NAME = "SkillStore";
const BRANCH = "main";

const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// Root of the SkillStore repo (parent of web/)
const REPO_ROOT = path.resolve(process.cwd(), "..");

/**
 * Read marketplace.json — local filesystem at build time, GitHub API at runtime.
 */
export async function getMarketplaceJson() {
  // Try local filesystem first (works during build and dev)
  try {
    const localPath = path.join(REPO_ROOT, ".claude-plugin", "marketplace.json");
    const data = await fs.readFile(localPath, "utf-8");
    return JSON.parse(data);
  } catch {
    // Fallback to GitHub raw content (works at runtime on Vercel)
    const res = await fetch(`${RAW_BASE}/.claude-plugin/marketplace.json`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      throw new Error(`Failed to load marketplace.json: ${res.status}`);
    }
    return res.json();
  }
}

/**
 * Read a SKILL.md file — local filesystem first, then GitHub.
 */
export async function getSkillContent(source: string): Promise<string> {
  try {
    const localPath = path.join(REPO_ROOT, source);
    return await fs.readFile(localPath, "utf-8");
  } catch {
    const res = await fetch(`${RAW_BASE}/${source}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      throw new Error(`Failed to load ${source}: ${res.status}`);
    }
    return res.text();
  }
}
