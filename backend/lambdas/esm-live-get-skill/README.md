# esm-live-get-skill

Checks whether a skill slug exists in the catalog. Returns 200 if found, 404 if not.

Used by sync scripts to skip already-imported slugs on re-runs and by migration tooling to avoid duplicate creation.

## Operation

**GET /skills/{slug}** — Operation 5 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024439288).

## Request

| Field | Source | Required | Description |
|---|---|---|---|
| `slug` | query param or body | yes | Skill slug to check |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"slug": "...", "exists": true}` | Slug found |
| 404 | `{"slug": "...", "exists": false}` | Slug not found |
| 500 | `{"message": "..."}` | Error |

## S3 Check

HEAD request on:
```
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/metadata.json
```
