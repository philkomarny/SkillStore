# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

SkillStore is an enterprise skill catalog for Claude Code, targeting higher education institutions. It has two parts:
1. **Skills content** — `SKILL.md` files organized under `skills/<department>/<skill-name>/`
2. **Web catalog** — a Next.js app in `web/` for browsing and discovering skills

A second Next.js app exists in `v2/` (adds Stripe billing and a skill submission workflow) but `web/` is the primary production app.

## Development Commands

All commands run from `web/`:

```bash
cd web
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

For `v2/`:
```bash
cd v2
npm run dev
npm run build
npm run lint
```

## Environment Setup

Copy `web/.env.example` to `web/.env.local`. Key variables:

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Increases GitHub API rate limit (60 → 5,000 req/hr); required for private forks |
| `AUTH_SECRET` | NextAuth secret — generate with `npx auth secret` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase (enterprise features) |
| `SKILLSTORE_REPO_OWNER/NAME/BRANCH` | Override to point the web catalog at a fork |

## Architecture

### Data Flow

The web catalog reads all skill data from GitHub at runtime (with 60-second revalidation). The data flow is:

1. `.claude-plugin/marketplace.json` is the single source of truth — it lists every skill with its `source` path, name, description, version, category, and tags.
2. `web/src/lib/github.ts` fetches `marketplace.json` and individual `SKILL.md` files from GitHub raw content, with local filesystem fallback for development.
3. `web/src/lib/skills.ts` parses the markdown frontmatter (via `gray-matter`) and exposes typed helpers: `getAllSkills`, `getSkillsByDepartment`, `getSkillDetail`, `getDepartments`, `searchSkills`.
4. Next.js App Router pages/API routes call these helpers directly (server-side).

### Enterprise Context Pattern

Enterprise forks can add `context.md` files alongside each `SKILL.md` to inject institution-specific data. The web catalog detects these automatically. A separate enterprise context repo is also supported — the `getEnterpriseContextContent` function in `github.ts` strips the `skills/` prefix from the source path and fetches `context.md` from the enterprise repo.

### Skill Categories (marketplace.json)

The catalog organizes skills under these categories (directory names under `skills/`):
- `enrollment-admissions`
- `marketing-communications`
- `academic-programs`
- `student-success`
- `grants-finance`
- `research-data`
- `compliance-accreditation`
- `it-operations`
- `hr`

### Key Files

- `.claude-plugin/marketplace.json` — catalog index; must be updated when adding/updating any skill
- `web/src/lib/github.ts` — all GitHub and filesystem I/O
- `web/src/lib/skills.ts` — business logic for skill retrieval and search
- `web/src/lib/types.ts` — `SkillEntry`, `SkillDetail`, `Marketplace`, `DEPARTMENTS` constants

## Skill Authoring

### SKILL.md Format

Every skill requires YAML frontmatter:

```yaml
---
name: skill-name          # kebab-case, must match directory name
description: >
  One sentence. Must include TRIGGER keyword.
version: 1.0.0            # SemVer
category: department-name # must match directory
tags: [tag1, tag2, tag3]  # 3-6 tags, kebab-case
---
```

Required body sections: title (H1), role statement, "When to Activate" bullets, core framework/process, templates/output formats, input requirements, anti-patterns.

### Adding a New Skill

1. Create `skills/<department>/<skill-name>/SKILL.md`
2. Add an entry to `.claude-plugin/marketplace.json` (name, source, description, version, category, tags)
3. Branch name convention: `skill/<department>/<skill-name>`

### Updating a Skill

1. Edit `SKILL.md`
2. Bump version in both the frontmatter and `marketplace.json`
3. Branch name convention: `update/<skill-name>`

### Quality Rules

- Skills must be under 500 lines
- Higher-education specific (not generic business skills)
- Must include anti-patterns section
- `marketplace.json` entry must match frontmatter fields exactly
