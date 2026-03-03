# SkillStore

Enterprise skill catalog for Claude Code — curated, versioned skills for higher education institutions.

## What is SkillStore?

SkillStore is a browsable, installable catalog of `SKILL.md` files for Claude Code, organized by department and use case. It enables strategic rollout of AI across higher education by providing:

- **Curated skills** written by domain experts for enrollment, marketing, academics, student success, and finance
- **A web catalog** for browsing, searching, and discovering skills
- **Native CLI integration** so any Claude Code user can install skills directly

## Quick Start

### Browse the Catalog

Visit **[skillstore.vercel.app](https://skillstore.vercel.app)** to search and explore all available skills.

### Install via CLI

```bash
# Add SkillStore as a marketplace
plugin marketplace add philkomarny/SkillStore

# Install a specific skill
plugin install prospect-outreach@skillstore
plugin install curriculum-designer@skillstore
```

## Available Skills

### Enrollment
| Skill | Description |
|-------|------------|
| [prospect-outreach](skills/enrollment/prospect-outreach/SKILL.md) | Personalized outreach to prospective students across recruitment funnel stages |
| [application-reviewer](skills/enrollment/application-reviewer/SKILL.md) | Holistic student application review with scoring rubrics |

### Marketing
| Skill | Description |
|-------|------------|
| [enrollment-campaign](skills/marketing/enrollment-campaign/SKILL.md) | Analyze enrollment marketing campaigns and optimize recruitment spend |
| [content-brief](skills/marketing/content-brief/SKILL.md) | Content briefs for program pages, blogs, and recruitment materials |

### Academic
| Skill | Description |
|-------|------------|
| [curriculum-designer](skills/academic/curriculum-designer/SKILL.md) | Course and program curriculum design with learning outcomes alignment |
| [accreditation-writer](skills/academic/accreditation-writer/SKILL.md) | Self-study reports, compliance narratives, and accreditation documentation |

### Student Success
| Skill | Description |
|-------|------------|
| [early-alert-responder](skills/student-success/early-alert-responder/SKILL.md) | Triage student early alerts and draft intervention plans |

### Finance
| Skill | Description |
|-------|------------|
| [grant-proposal-writer](skills/finance/grant-proposal-writer/SKILL.md) | Federal and private grant proposals, budgets, and compliance narratives |

## Repository Structure

```
SkillStore/
├── .claude-plugin/
│   └── marketplace.json          ← Native Claude Code catalog index
├── skills/
│   ├── enrollment/               ← Admissions & recruitment
│   ├── marketing/                ← Enrollment marketing
│   ├── academic/                 ← Curriculum & accreditation
│   ├── student-success/          ← Retention & advising
│   └── finance/                  ← Grants & budgeting
├── web/                          ← Next.js catalog UI
├── CONTRIBUTING.md               ← Skill authoring guide
└── README.md
```

## How Skills Work

Each skill is a `SKILL.md` file that follows the Claude Code skill format:

```yaml
---
name: skill-name
description: >
  What the skill does and when to TRIGGER it.
version: 1.0.0
category: department
tags: [tag1, tag2]
---
```

The body contains instructions, templates, examples, and anti-patterns that Claude Code follows when the skill is activated.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the skill authoring guide, including format standards, naming conventions, and the PR process.

## License

MIT
