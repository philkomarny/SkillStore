# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

SkillStore is an enterprise skill catalog for Claude Code, targeting higher education institutions. It has three parts:
1. **Skills content** — `SKILL.md` files organized under `skills/<department>/<skill-name>/`
2. **Web catalog** — a Next.js app in `v2/` for browsing, discovering, and submitting skills
3. **Backend** — Python Lambda functions in `backend/` that power the API (skill store, document store, context store)

> **Note:** `web/` is legacy and inactive. All active development happens in `v2/` and `backend/`.

## Development Commands

### Frontend (v2/)

```bash
cd v2
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (backend/)

```bash
# Lambda integration tests (requires Poetry)
cd backend/tests
poetry install
poetry run pytest                          # Run all Lambda integration tests
poetry run pytest lambdas/test_document_api.py  # Run a single test file
poetry run pytest -k test_upload           # Run tests matching a pattern

# Shared library — propagate skillstore_base wheel to all Lambdas
cd backend/lambdas
make copy-wheels                           # Copy from default source Lambda
make copy-wheels SOURCE=esm-live-list-skills  # Copy from a specific Lambda
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

**Document Lambda Endpoints** (`v2/src/lib/document-store.ts`):

| Operation | Method | URL |
|---|---|---|
| Upload document | POST | `https://plvh12o05c.execute-api.us-west-2.amazonaws.com/prod/esm_live_upload_document_post` |
| Get document | GET | `https://ikt0pbkcx1.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_document_get` |
| List documents | GET | `https://durik7cyze.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_documents_get` |
| Delete document | DELETE | `https://l9h3c7vji5.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_document_delete` |

Upload returns `{ md5, status }`. Text extraction (PDF, DOCX, images) is triggered automatically by Lambda-to-Lambda invocation — no separate extraction endpoint. `getDocument` returns `null` on 404; plain text is only available when `status: "ready"`. Delete removes from user's library only — the global content-addressable record (keyed by MD5) is preserved for other users.

**Context Lambda Endpoints** (`v2/src/lib/context-store.ts`):

| Operation | Method | URL |
|---|---|---|
| Add context | POST | `https://vzy0yc5j2l.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_context_post` |
| Get context | GET | `https://hgvubq1ga7.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_context_get` |
| List contexts | GET | `https://pr0dbmvk19.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_contexts_get` |
| Delete context | DELETE | `https://aj8uetqx8e.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_context_delete` |

Context creation accepts an array of document MD5 hashes. Synthesis is synchronous via Bedrock (5–15s). All `user_id` params are Google OAuth subject IDs.

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
| `v2/src/lib/document-store.ts` | Lambda API wrapper — global content-addressable document store (upload/get/list/delete by MD5) |
| `v2/src/lib/context-store.ts` | Lambda API wrapper — context CRUD (create/get/list/delete) |
| `v2/src/lib/context-processor.ts` | Document text extraction + Claude context synthesis |
| `v2/src/auth.ts` | next-auth config — Google OAuth, JWT session, user upsert on sign-in |

### Next.js API Routes

Routes in `v2/src/app/api/`:

| Route | Purpose |
|-------|---------|
| `auth/[...nextauth]` | Google OAuth sign-in/sign-out |
| `skills/` | List/search skills |
| `skills/submit` | Submit new skill to catalog |
| `skills/copy` | Copy base skill to user's Refinery |
| `skills/refine` | AI refinement of skill + context |
| `skills/[slug]/vouch` | Vouch for a skill |
| `skills/[slug]/download` | Download skill as SKILL.md |
| `user/` | Get/update user profile |
| `user-skills/[id]` | CRUD for user's copied skills |
| `context/upload` | Upload document for context creation |
| `context/process` | Claude-powered context synthesis from documents |
| `context/profiles` | CRUD for named context profiles |
| `context/[slug]` | Legacy per-skill context |
| `checkout/` | Stripe checkout session creation |
| `billing/portal` | Stripe customer portal redirect |
| `webhooks/stripe` | Stripe webhook handler |
| `cron/review-queue` | Automated bot verification (Vercel cron) |

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
- **Documents** are stored in a global content-addressable store keyed by MD5 hash
- **Context formation** is currently handled by `POST /api/context/process` which calls Claude to synthesize uploaded files
- **Skill refinement** calls `POST /api/skills/refine` with a skill + context

### Testing

No Jest/Vitest in the frontend. Three layers of validation:

```bash
# 1. Frontend lint
cd v2 && npm run lint

# 2. Backend Lambda integration tests (pytest)
cd backend/tests && poetry run pytest

# 3. Playwright E2E smoke tests against https://www.eduskillsmp.com
cd backend/libs/skillstore-smoke && make test        # Run smoke tests
cd backend/libs/skillstore-smoke && make setup-auth  # One-time: save auth session
cd backend/libs/skillstore-smoke && make all         # Install deps + run tests
```

The smoke tests use Firefox (headless Chromium is blocked by Cloudflare). `auth-state.json` is gitignored — run `make setup-auth` once to generate it.

### Vercel Cron

A cron job runs `POST /api/cron/review-queue` every 5 minutes (configured in `vercel.json`) for automated bot verification of skills.

### Deployed Site

`https://www.eduskillsmp.com` — hosted on Vercel, auto-deploys on push to `main`.

### Backend Architecture

`backend/` contains the Python Lambda functions behind the API Gateway endpoints:

- **`backend/lambdas/`** — Each `esm-live-*` directory is a standalone Lambda (e.g., `esm-live-upload-document`, `esm-live-add-context`). Each has its own `lambda_function.py` entry point, `Dockerfile`, and `update.sh` deploy script.
- **`backend/libs/skillstore-base/`** — Shared Python library (`skillstore_base` wheel) distributed to all Lambdas via `make copy-wheels`. Contains common utilities used across Lambdas.
- **`backend/libs/skillstore-smoke/`** — Playwright-based E2E smoke tests against the production site.
- **`backend/tests/`** — pytest integration tests that hit the live Lambda endpoints directly (30s timeout per test).

Document upload triggers a Lambda-to-Lambda chain: upload → text extraction (PDF/DOCX/image-specific Lambdas) → stored as extracted text.

Beyond the API-facing Lambdas listed above, internal Lambdas handle: text extraction (`esm-live-extract-pdf-text`, `esm-live-extract-docx-text`, `esm-live-extract-image-text`), Google auth mapping (`esm-live-add-google-auth`, `esm-live-get-google-auth`), bulk operations (`esm-live-bulk-import-skills`, `esm-live-export-skills`), and usage tracking (`esm-live-add-item-count`, `esm-live-get-item-count`).

- **`backend/scripts/`** — Shell scripts for Lambda deployment automation (build, push to ECR, update function code).

#### Lambda Deployment Commands

```bash
# Update an existing Lambda (auto-increments version, builds Docker, pushes to ECR, updates function)
cd backend/scripts
./update-lambda.sh --repo-name esm-live-upload-document-repo

# Full automation for a NEW Lambda (interactive — prompts for architecture)
# Creates ECR repo, builds image, creates Lambda function, polls for readiness
./full-automation.sh --repo-name esm-live-my-new-lambda-repo

# Per-Lambda deploy (each Lambda directory has its own update script)
cd backend/lambdas/esm-live-upload-document
./update.sh
```

> **Note:** `full-automation.sh` uses interactive prompts (`read -p`) and cannot be run non-interactively.

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
