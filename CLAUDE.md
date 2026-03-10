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
| `GITHUB_TOKEN` | Legacy — was used to fetch skills from GitHub; no longer primary data source |
| `AUTH_SECRET` | next-auth secret — generate with `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth app credentials |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase database |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe billing |
| `STRIPE_LEVEL1_PRICE_ID` / `STRIPE_LEVEL2_PRICE_ID` | Stripe price IDs for skill purchase ($0.99) and subscription ($50/mo) |
| `ANTHROPIC_API_KEY` | Claude API for skill refinement and context file processing |
| `SKILLSTORE_REPO_OWNER/NAME/BRANCH` | Override to point catalog at a fork |

## Architecture

### Tech Stack (v2)

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Auth**: next-auth v5 beta (Google OAuth only)
- **Database**: Supabase
- **Payments**: Stripe
- **AI**: @anthropic-ai/sdk
- **Markdown**: gray-matter (frontmatter), react-markdown + remark-gfm

### Data Flow

Skill content is served from a **Lambda-backed S3 skill store** via AWS API Gateway. The original GitHub raw content + Supabase Storage paths are commented out in code with `[SKILL-STORE]` / `[/SKILL-STORE]` markers for rollback.

1. `v2/src/lib/skill-store.ts` is the thin wrapper around all Lambda endpoints — `listSkills()`, `getSkillContent()`, `addSkillContent()`, `updateSkillContent()`
2. `v2/src/lib/skills.ts` calls `skill-store.ts` and exposes `getAllSkills`, `getSkillsByDepartment`, `getSkillDetail`, `getDepartments`, `searchSkills`
3. Next.js App Router pages/API routes call these helpers server-side

To roll back to GitHub/Supabase Storage: uncomment the `[SKILL-STORE]` blocks and delete the replacement calls.

### Lambda Endpoints

| Operation | Method | URL |
|---|---|---|
| List skills | GET | `https://p302y68q3d.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_skills_get` |
| Get skill content | GET | `https://wqechxpkgb.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_skill_content_get` |
| Add skill content | POST | `https://nm260lbj42.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_skill_content_post` |
| Update skill content | POST | `https://eyq3dgqjs3.execute-api.us-west-2.amazonaws.com/prod/esm_live_update_skill_content_post` |

All endpoints use no auth header. GET params as query string, POST params as JSON body.

### Key Files

| File | Purpose |
|------|---------|
| `v2/src/lib/skill-store.ts` | Lambda API wrapper — primary skill data source |
| `v2/src/lib/skills.ts` | Skill catalog loading and search |
| `v2/src/lib/types.ts` | `SkillEntry`, `SkillDetail`, `DEPARTMENTS` types |
| `v2/src/lib/users.ts` | User context and vouch system |
| `v2/src/lib/access.ts` | Access control logic |
| `v2/src/lib/supabase.ts` | Supabase client |
| `v2/src/lib/stripe.ts` | Stripe billing helpers |
| `v2/src/lib/context-processor.ts` | Document text extraction + Claude context synthesis |

### Access Control Tiers

Defined in `v2/src/lib/access.ts`. Skills have a `verification_level` (0–2):

| Level | Label | Access |
|-------|-------|--------|
| 0 | Community | Always free |
| 1 | Bot Verified | Free 30-day trial, then $0.99/skill purchase |
| 2 | Expert Verified | Requires Level 2 subscription ($50/mo) |

### Supabase Schema

Key tables in `v2/supabase/schema.sql`:

| Table | Purpose |
|-------|---------|
| `users` | Profiles with `google_id`, `stripe_customer_id`, `subscription_tier` |
| `skills` | Skill registry with `slug`, `verification_level`, `vouch_count`, `is_published` |
| `user_skills` | User's personal copies of skills in the Refinery |
| `purchases` | Per-skill purchases tied to Stripe payment intents |
| `subscriptions` | Active Stripe subscriptions with plan/status/period |
| `context_profiles` | Named context objects (e.g. "Admissions 2024") with synthesized markdown |
| `context_files` | Source documents uploaded per context profile |
| `user_contexts` | Legacy: per-skill context markdown (skill-scoped, being superseded) |
| `vouches` | Skill endorsements (composite unique: user+skill) |
| `verification_queue` | Bot/expert review queue with `bot_report` JSONB |

### Refinery Architecture

The `/dashboard` page is the Skills Refinery — users copy base skills, upload institutional documents to form contexts, then refine skills against those contexts.

- **Contexts** are AI-synthesized markdown from uploaded documents, not the documents themselves
- **Documents** are planned to become a global content-addressable store keyed by MD5 hash (see issue #14)
- **Context formation** is currently handled by `POST /api/context/process` which calls Claude to synthesize uploaded files
- **Skill refinement** calls `POST /api/skills/refine` with a skill + context

### Testing

No Jest/Vitest. Two layers of validation:

```bash
cd v2 && npm run lint                   # TypeScript + ESLint

# Playwright E2E against https://www.eduskillsmp.com
cd skillstore-smoke && make test        # Run smoke tests
cd skillstore-smoke && make setup-auth  # One-time: save auth session for authenticated tests
cd skillstore-smoke && make all         # Install deps + run tests
```

The smoke tests use Firefox (headless Chromium is blocked by Cloudflare). `auth-state.json` is gitignored — run `make setup-auth` once to generate it.

### Deployed Site

`https://www.eduskillsmp.com` — hosted on Vercel, auto-deploys on push to `main`.

### Enterprise Context Pattern

Enterprise forks can add `context.md` files alongside each `SKILL.md` to inject institution-specific data (school name, programs, voice). The web catalog detects these automatically. A separate enterprise context repo is also supported.

## Skill Authoring

### SKILL.md Format

```yaml
---
name: skill-name              # kebab-case, matches directory name
description: >
  One sentence. Must include TRIGGER keyword.
version: 1.0.0                # SemVer
category: department-name     # must match directory
tags: [tag1, tag2, tag3]      # 3-6 tags, kebab-case
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
