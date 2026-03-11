# esm-live-export-skills

Exports a full point-in-time snapshot of the skill catalog to S3.

Reads all skill slugs in parallel (metadata + content + lineage) and writes a single JSON array to `_exports/`. Used for backups and for enterprise fork operators seeding a fresh instance.

## Operation

**GET /skills/export** — Operation 9 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024445038).

## Request

No input required.

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"export_key": "...", "skill_count": N}` | Export written to S3 |
| 500 | `{"message": "..."}` | Error |

## S3 Output

```
s3://mskillsiq/eduskillsmp/skill-catalog/_exports/<YYYYMMDD>-<uuid>.json
```

Each entry in the export array:
```json
{
  "slug": "my-skill",
  "metadata": { ... },
  "content": "---\nname: ...\n---\n# content",
  "lineage": { "current_status": "approved", "verification_level": 2, "events": [...] }
}
```
