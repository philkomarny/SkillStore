# esm-live-bulk-import-skills

Bulk-imports multiple skills in a single invocation. Idempotent — re-running safely overwrites existing objects.

Used by `scripts/esm/esm-bat-bulk-import-skills.py` to migrate the 80 curated skills from the local SkillStore repository. All curated skills are bootstrapped as `status=approved`, `verification_level=2` and appear in the public catalog immediately.

All S3 writes happen in parallel via `ThreadPoolExecutor(max_workers=20)`. `_index.json` is rebuilt once after all slugs are written.

## Operation

**POST /skills/bulk** — Operation 4 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024444202).

## Request Body

JSON array of skill objects:

```json
[
  {
    "slug": "my-skill",
    "content": "---\nname: ...\n---\n# content",
    "metadata": {
      "name": "My Skill",
      "description": "...",
      "category": "it-operations",
      "tags": ["tag1"],
      "source": "curated",
      "author_id": null,
      "version": "1.0.0"
    }
  }
]
```

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"imported": N, "failed": N, "failures": [...]}` | Completed (partial success included) |
| 500 | `{"message": "..."}` | Parse or validation error |

## S3 Writes (per slug)

```
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/content.md
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/metadata.json
s3://mskillsiq/eduskillsmp/skill-catalog/<slug>/lineage.json
s3://mskillsiq/eduskillsmp/skill-catalog/_index.json  (rebuilt once at end)
```
