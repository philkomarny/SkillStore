# esm-live-update-skill-content

Updates the markdown content of an existing skill.

Overwrites `content.md`, appends a `content_updated` event to `lineage.json`, and rebuilds `_index.json`. Does not modify `metadata.json` — name, category, tags, and status are unchanged.

## Operation

**PUT /skills/{slug}/content** — Operation 6 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024442477).

## Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | yes | Skill slug to update |
| `content` | string | yes | New raw markdown including YAML frontmatter |
| `by` | string | yes | Google OAuth subject ID or system actor (e.g. `"sync-bot"`) |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"slug": "..."}` | Content updated |
| 404 | `{"message": "Skill not found: <slug>"}` | Slug not found |
| 500 | `{"message": "..."}` | Error |

## S3 Writes

```
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/content.md   (overwritten)
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/lineage.json  (appended)
s3://mskillsiq/eduskillsmp/skill-catalog/_index.json          (rebuilt)
```
