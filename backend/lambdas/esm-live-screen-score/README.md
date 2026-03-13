# esm-live-screen-score

Stage 2 of `esm-live-screen-skills` (#40, renamed #46).

Scores the severity of a non-safe skill classification (1–5) using Claude Haiku via Bedrock. Only invoked when Stage 1 classifies as non-helpful. Invoked by the `esm-live-screen-skills` Step Function — accepts and returns native JSON.

## Severity Scale

| Score | Level | Meaning |
|-------|-------|---------|
| 1 | Minimal | Likely false positive |
| 2 | Low | Minor concern, unlikely to cause harm |
| 3 | Medium | Clear non-standard intent, limited impact |
| 4 | High | Clear malicious intent or significant harm potential |
| 5 | Critical | Unambiguous attack or dangerous content |

## Input (from Step Function — enriched by Stage 1)

```json
{ "content": "...", "slug": "skill-name", "author_id": "...", "bucket": "prompt-injection-attack", "reasoning": "..." }
```

## Output (enriched passthrough)

```json
{ "content": "...", "slug": "...", "author_id": "...", "bucket": "...", "reasoning": "...", "score": 4, "justification": "..." }
```
