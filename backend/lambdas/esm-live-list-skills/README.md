# esm-live-list-skills

Returns the published skill catalog. Serves the pre-built `_index.json` for constant-latency reads.

Handles both the public catalog view and the admin all-statuses view via `?status=all`.

## Operation

**GET /skills** and **GET /skills?status=all** — Operations 1 & 8 in the skill catalog API.

See [philkomarny/SkillStore#11 — implementation comment](https://github.com/philkomarny/SkillStore/issues/11#issuecomment-4024440860).

## Request

| Field | Source | Required | Description |
|---|---|---|---|
| `status` | query param | no | Pass `"all"` to include all statuses (admin). Omit for approved only. |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | JSON array of catalog entries | Success |
| 500 | `{"message": "..."}` | Error |

Each catalog entry:
```json
{
  "slug": "prospect-outreach",
  "name": "Prospect Outreach",
  "description": "...",
  "category": "enrollment-admissions",
  "tags": ["outreach"],
  "version": "1.0.0",
  "verificationLevel": 2,
  "status": "approved"
}
```

## S3 Layout

- Standard reads: `eduskillsmp/skills/catalog/_index.json`
- Admin view (`?status=all`): rebuilds index on-the-fly from all `*/metadata.json` files
