# esm-live-delete-skill

Soft-deletes a skill by marking it as deprecated.

Sets `metadata.json` status to `"deprecated"`, appends a `deprecated` event to `lineage.json`, and rebuilds `_index.json`. S3 files are retained for audit. Deprecated skills are excluded from the public catalog view.

## Operation

**DELETE /skills/{slug}** — Operation 7 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024443281).

## Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | yes | Skill slug to deprecate |
| `by` | string | yes | Google OAuth subject ID or system actor |
| `note` | string | no | Deprecation reason (stored in lineage event) |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"slug": "..."}` | Skill deprecated |
| 404 | `{"message": "Skill not found: <slug>"}` | Slug not found |
| 500 | `{"message": "..."}` | Error |

## S3 Writes

```
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/metadata.json  (status → deprecated)
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/lineage.json   (appended)
s3://mskillsiq/eduskillsmp/skill-catalog/_index.json           (rebuilt)
```
