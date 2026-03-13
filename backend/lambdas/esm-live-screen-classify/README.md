# esm-live-screen-classify

Stage 1 of `esm-live-screen-skills` (#40, renamed #46).

Classifies skill content into one of six safety buckets using Claude Haiku via Bedrock. Invoked by the `esm-live-screen-skills` Step Function — accepts and returns native JSON (not HTTP-style responses).

## Buckets

| Bucket | Description |
|--------|-------------|
| `helpful-skill` | Legitimate, safe skill |
| `prompt-injection-attack` | Jailbreak / instruction override attempts |
| `harmful-instructions` | Instructions that could cause harm |
| `data-exfiltration` | Attempts to extract sensitive data |
| `impersonation` | Posing as authority / system |
| `policy-violation` | Other ToS violations |

## Input (from Step Function)

```json
{ "content": "<full skill markdown>", "slug": "skill-name", "author_id": "google-sub-id" }
```

## Output (enriched passthrough)

```json
{ "content": "...", "slug": "skill-name", "author_id": "...", "bucket": "helpful-skill", "reasoning": "..." }
```
