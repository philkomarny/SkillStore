import fs from "fs/promises";
import path from "path";

const REPO_OWNER = process.env.SKILLSTORE_REPO_OWNER || "philkomarny";
const REPO_NAME = process.env.SKILLSTORE_REPO_NAME || "SkillStore";
const BRANCH = process.env.SKILLSTORE_BRANCH || "main";

const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// Root of the SkillStore repo (parent of v2/)
const REPO_ROOT = path.resolve(process.cwd(), "..");

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export function getRepoConfig() {
  return {
    owner: REPO_OWNER,
    name: REPO_NAME,
    branch: BRANCH,
    repoUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
    rawBase: RAW_BASE,
  };
}

export async function getMarketplaceJson() {
  // Try GitHub raw content first
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

  // Fallback to local filesystem
  const localPath = path.join(REPO_ROOT, ".claude-plugin", "marketplace.json");
  const data = await fs.readFile(localPath, "utf-8");
  return JSON.parse(data);
}

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
