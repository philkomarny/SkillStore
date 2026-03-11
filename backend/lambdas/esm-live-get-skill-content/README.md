# esm-live-get-skill-content

Returns the raw SKILL.md content for a single skill slug, including YAML frontmatter.

Called on skill detail page renders and by the automated LLM review cron.

## Operation

**GET /skills/{slug}/content** — Operation 2 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024440011).

## Request

| Field | Source | Required | Description |
|---|---|---|---|
| `slug` | query param or body | yes | Skill slug |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | raw markdown string | Content returned |
| 404 | `{"message": "Skill not found: <slug>"}` | Slug not found |
| 500 | `{"message": "..."}` | Error |

## S3 Read

```
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/content.md
```
