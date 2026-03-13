# esm-live-screen-orchestrate

Entry point for the `esm-live-screen-skills` Express Step Function (#40, renamed #46).

Validates input and executes `esm-live-screen-skills` synchronously. Returns the final screening decision to the caller.

## Input

```json
{
  "content": "<full refined skill markdown>",
  "slug": "skill-name",
  "author_id": "google-sub-id"
}
```

## Output

```json
{ "decision": "accept", "audit_key": "eduskillsmp/skills/screening/skill-name/20260312T143000Z.json" }
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SCREENING_STATE_MACHINE_ARN` | Yes | ARN of the esm-live-screen-skills Express Step Function |

## Pipeline Flow

```
Orchestrator → Step Function:
  Classify → [helpful-skill?] → Yes → Decide(score=0)
                               → No  → Score → Decide
← { decision, audit_key }
```
