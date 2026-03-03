# Contributing to SkillStore

Thank you for contributing to the SkillStore skill catalog. This guide covers the skill authoring standard, quality expectations, and submission process.

## Skill Authoring Standard

### Directory Structure

Every skill lives in its own directory under the appropriate department:

```
skills/<department>/<skill-name>/
├── SKILL.md              ← Required: the skill definition
├── context.md            ← Optional: institution-specific context (enterprise forks)
├── context.md.example    ← Optional: template for context files
└── references/           ← Optional: supporting materials
    ├── templates.md
    └── examples.md
```

> **context.md convention:** Enterprise forks add `context.md` files alongside skills to provide institution-specific data (school name, programs, voice, deadlines). These files are not included in the upstream repo — they live only in your fork. The web catalog detects them automatically and shows them in the skill detail page. See `skills/enrollment/prospect-outreach/context.md.example` for a template.

### Department Categories

| Category | Directory | Covers |
|----------|-----------|--------|
| Enrollment | `skills/enrollment/` | Admissions, recruitment, yield, applications |
| Marketing | `skills/marketing/` | Enrollment marketing, content, campaigns |
| Academic | `skills/academic/` | Curriculum, accreditation, assessment, faculty |
| Student Success | `skills/student-success/` | Advising, retention, early alert, support services |
| Finance | `skills/finance/` | Grants, budgets, expenses, financial aid |
| HR | `skills/hr/` | Faculty hiring, staff recruitment, compliance |
| IT | `skills/it/` | Systems, security, infrastructure, ed-tech |

### SKILL.md Format

Every `SKILL.md` must include:

#### 1. YAML Frontmatter

```yaml
---
name: skill-name                    # kebab-case, unique across catalog
description: >
  One-sentence description of what the skill does.
  Must include TRIGGER keyword for activation context.
version: 1.0.0                     # SemVer
category: department               # Must match directory
tags: [tag1, tag2, tag3]           # 3-6 tags for discoverability
---
```

#### 2. Required Sections

| Section | Purpose |
|---------|---------|
| **Title (H1)** | Skill name as a heading |
| **Role statement** | 1-2 sentences: "You are a..." defining the persona |
| **When to Activate** | Bullet list of trigger conditions |
| **Core framework/process** | The main methodology or workflow |
| **Templates/output formats** | Structured templates for outputs |
| **Input requirements** | What to ask the user for before executing |
| **Anti-patterns** | Explicit "DO NOT" rules |

#### 3. Quality Standards

- **Under 500 lines.** If a skill needs more, split reference material into `references/` files.
- **Actionable, not theoretical.** Skills should produce outputs, not explain concepts.
- **Specific to higher education.** Generic business skills belong in other catalogs.
- **Tested.** Before submitting, test the skill with Claude Code to verify it produces useful results.

### Naming Conventions

- **Directory names:** `kebab-case` (e.g., `early-alert-responder`)
- **Skill names:** Match the directory name exactly
- **Tags:** `kebab-case`, lowercase (e.g., `enrollment-marketing`)
- **Categories:** Match the department directory name

### Versioning

Follow [SemVer](https://semver.org/):
- **Patch (1.0.1):** Typo fixes, minor wording changes
- **Minor (1.1.0):** New sections, templates, or examples added
- **Major (2.0.0):** Fundamental changes to the skill's approach or structure

## Submission Process

### Adding a New Skill

1. **Fork** the repository
2. **Create a branch** named `skill/<department>/<skill-name>`
3. **Create** the skill directory and `SKILL.md` following the format above
4. **Add** the skill entry to `.claude-plugin/marketplace.json`
5. **Test** the skill with Claude Code
6. **Submit** a PR with:
   - The skill files
   - Updated `marketplace.json`
   - A brief description of the use case and target audience

### Updating an Existing Skill

1. **Create a branch** named `update/<skill-name>`
2. **Update** the `SKILL.md` content
3. **Bump** the version in both the frontmatter and `marketplace.json`
4. **Submit** a PR explaining what changed and why

### PR Review Criteria

PRs will be reviewed for:

- [ ] Follows the SKILL.md format standard
- [ ] Frontmatter is complete and valid
- [ ] `marketplace.json` entry matches frontmatter
- [ ] Under 500 lines
- [ ] Includes anti-patterns section
- [ ] Includes input requirements section
- [ ] Higher-education specific (not generic business)
- [ ] Tested with Claude Code

## Tips for Writing Good Skills

1. **Start with the output.** What does the user want to produce? Design the skill backward from there.
2. **Include templates.** Structured output templates make skills immediately useful.
3. **Be opinionated.** Good skills make decisions about best practices so the user doesn't have to.
4. **Add anti-patterns.** "DO NOT" rules prevent the most common mistakes.
5. **Use Bloom's verbs for outcomes.** Be precise about what the skill does: "analyze," "generate," "evaluate" — not "help with" or "assist."
6. **Test with real scenarios.** Use the skill on actual tasks before submitting.
