# esm-live-screen-decide

Stage 3 of the skill safety screening pipeline (#40).

Makes the final accept/review/reject decision and writes an audit record to S3. Invoked by the `screening-pipeline` Step Function — accepts native JSON, returns the final result.

## Decision Matrix

| Condition | Decision |
|-----------|----------|
| `helpful-skill` (any score) | accept |
| Score 1–2 | accept (flagged) |
| Score 3 | review (held for manual review) |
| Score >= `REJECT_THRESHOLD` (default 4) | reject |

## S3 Audit Records

Written to `eduskillsmp/skills/screening/<slug>/<timestamp>.json`.

## Input (from Step Function — enriched by Stages 1-2)

```json
{ "content": "...", "slug": "skill-name", "author_id": "...", "bucket": "...", "reasoning": "...", "score": 4, "justification": "..." }
```

## Output

```json
{ "decision": "reject", "audit_key": "eduskillsmp/skills/screening/skill-name/20260312T143000Z.json" }
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------||
| `BUCKET_NAME` | `mskillsiq` | S3 bucket for audit records |
| `REJECT_THRESHOLD` | `4` | Score at or above which skills are auto-rejected |
