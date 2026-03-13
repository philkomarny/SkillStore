# esm-live-screen-decide

Stage 3 of `esm-live-screen-skills` (#40, renamed #46).

Makes the final accept/review/reject decision, writes an audit record to S3, and writes a `screening.json` gate file to the skill's catalog prefix (#48). Invoked by the `esm-live-screen-skills` Step Function — accepts native JSON, returns the final result.

## Decision Matrix

| Condition | Decision |
|-----------|----------|
| `helpful-skill` (any score) | accept |
| Score 1–2 | accept (flagged) |
| Score 3 | review (held for manual review) |
| Score >= `REJECT_THRESHOLD` (default 4) | reject |

## S3 Outputs

- **Audit record**: `eduskillsmp/skills/screening/<slug>/<timestamp>.json` — full audit trail
- **Screening gate**: `eduskillsmp/skills/catalog/<slug>/screening.json` — binary `passed` flag for catalog visibility (#48)

## Input (from Step Function — enriched by Stages 1-2)

```json
{ "content": "...", "slug": "skill-name", "author_id": "...", "bucket": "...", "reasoning": "...", "score": 4, "justification": "..." }
```

## Output

```json
{ "decision": "reject", "audit_key": "eduskillsmp/skills/screening/skill-name/20260312T143000Z.json", "screening_key": "eduskillsmp/skills/catalog/skill-name/screening.json" }
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------||
| `BUCKET_NAME` | `mskillsiq` | S3 bucket for audit records |
| `REJECT_THRESHOLD` | `4` | Score at or above which skills are auto-rejected |
