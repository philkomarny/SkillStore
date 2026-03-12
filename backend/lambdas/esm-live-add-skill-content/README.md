# esm-live-add-skill-content

Creates a new community skill submission in the catalog.

Writes `content.md`, `metadata.json`, and the initial `lineage.json` for the slug, then rebuilds `_index.json`. New skills start as `status=pending` and are not visible in the public catalog until approved.

## Operation

**POST /skills/{slug}/content** — Operation 3 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024441766).

## Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | yes | Kebab-case skill identifier |
| `content` | string | yes | Raw markdown including YAML frontmatter |
| `name` | string | yes | Display name |
| `description` | string | yes | One-sentence description |
| `category` | string | yes | Department slug (e.g. `"it-operations"`) |
| `tags` | list | yes | Kebab-case tag strings |
| `author_id` | string | yes | Google OAuth subject ID |
| `author_name` | string | no | Display name of submitter |
| `version` | string | no | Semver string; defaults to `"1.0.0"` |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 201 | `{"slug": "..."}` | Skill created |
| 409 | `{"message": "Skill already exists: <slug>"}` | Slug already in catalog |
| 500 | `{"message": "..."}` | Error |

## S3 Writes

```
s3://mskillsiq/eduskillsmp/skills/catalog/<slug>/content.md
s3://mskillsiq/eduskillsmp/skills/catalog/<slug>/metadata.json
s3://mskillsiq/eduskillsmp/skills/catalog/<slug>/lineage.json
s3://mskillsiq/eduskillsmp/skills/catalog/_index.json  (rebuilt)
```
