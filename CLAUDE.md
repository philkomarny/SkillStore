# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

SkillStore is an enterprise skill catalog for Claude Code, targeting higher education institutions. It has two parts:
1. **Skills content** — `SKILL.md` files organized under `skills/<department>/<skill-name>/`
2. **Web catalog** — a Next.js app in `v2/` for browsing, discovering, and submitting skills

> **Note:** `web/` is legacy and inactive. All active development happens in `v2/`.

## Development Commands

All commands run from `v2/`:

```bash
cd v2
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Environment Setup

Create `v2/.env.local` with:

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Fetches skills from GitHub; required for private forks |
| `NEXTAUTH_SECRET` | next-auth secret |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase database |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | Stripe billing |
| `SKILLSTORE_REPO_OWNER/NAME/BRANCH` | Override to point catalog at a fork |

## Architecture

### Tech Stack (v2)

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Auth**: next-auth v5 beta
- **Database**: Supabase
- **Payments**: Stripe
- **AI**: @anthropic-ai/sdk
- **Markdown**: gray-matter (frontmatter), react-markdown + remark-gfm

### Data Flow

1. `.claude-plugin/marketplace.json` is the single source of truth — lists every skill with `source` path, name, description, version, category, and tags.
2. `v2/src/lib/github.ts` fetches `marketplace.json` and individual `SKILL.md` files from GitHub raw content.
3. `v2/src/lib/skills.ts` parses frontmatter via `gray-matter` and exposes `getAllSkills`, `getSkillsByDepartment`, `getSkillDetail`, `getDepartments`, `searchSkills`.
4. Next.js App Router pages/API routes call these helpers server-side.

### Key Files

| File | Purpose |
|------|---------|
| `.claude-plugin/marketplace.json` | Catalog index — update when adding/modifying any skill |
| `v2/src/lib/skills.ts` | Skill catalog loading and search |
| `v2/src/lib/github.ts` | GitHub API for fetching SKILL.md content |
| `v2/src/lib/types.ts` | `SkillEntry`, `SkillDetail`, `DEPARTMENTS` types |
| `v2/src/lib/users.ts` | User context and vouch system |
| `v2/src/lib/access.ts` | Access control logic |
| `v2/src/lib/supabase.ts` | Supabase client |
| `v2/src/lib/stripe.ts` | Stripe billing helpers |

### Enterprise Context Pattern

Enterprise forks can add `context.md` files alongside each `SKILL.md` to inject institution-specific data (school name, programs, voice). The web catalog detects these automatically. A separate enterprise context repo is also supported.

## Skill Authoring

### SKILL.md Format

```yaml
---
name: "skill-name"          # kebab-case, matches directory name
description: "One sentence. TRIGGER when user needs to [specific use case]."
metadata:
  version: 1.0.0            # SemVer
  category: department-name # must match directory
  tags: [tag1, tag2, tag3]  # 3-6 tags, kebab-case
---
```

Required body sections (in order): H1 title, role statement ("You are a..."), "When to Activate" bullets, core framework/process, templates/output formats, "Input Requirements", "Anti-Patterns".

### Skill Categories

| Directory | Covers |
|-----------|--------|
| `enrollment-admissions/` | Admissions, recruitment, yield, waitlist |
| `marketing-communications/` | Enrollment marketing, content, campaigns |
| `academic-programs/` | Curriculum, accreditation, assessment |
| `student-success/` | Advising, retention, early alert |
| `grants-finance/` | Grants, budgets, financial aid |
| `it-operations/` | Systems, security, ed-tech |
| `compliance-accreditation/` | FERPA, Title IX, SACSCOC, Clery |
| `research-data/` | IRB, surveys, institutional research |
| `hr/` | Faculty hiring, staff recruitment |

### Adding a New Skill

1. Create `skills/<department>/<skill-name>/SKILL.md`
2. Add an entry to `.claude-plugin/marketplace.json`
3. Branch name: `skill/<department>/<skill-name>`

### Updating a Skill

1. Edit `SKILL.md`
2. Bump version in both frontmatter and `marketplace.json`
3. Branch name: `update/<skill-name>`

### Quality Rules

- Under 500 lines — split reference material into `references/` if needed
- Higher-education specific (not generic business skills)
- Must include anti-patterns section
- Every email template must stay under 150 words
- `marketplace.json` entry must match frontmatter fields exactly

## Git Conventions

**Do NOT commit until explicitly asked.**

Commit message format — one line, conventional prefix only:
- `feat:` — New skill or feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `chore:` — Maintenance (frontmatter, metadata, tags)
- `deploy:` — Vercel/infra changes

**Never** add `Co-Authored-By` lines or Claude attribution to commits or PRs.
