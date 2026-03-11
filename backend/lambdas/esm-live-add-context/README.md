# esm-live-add-context

Creates a context — a named LLM synthesis over a set of documents.

Validates all referenced document MD5s are `ready`, fetches their extracted text, synthesises a structured markdown summary via Claude Haiku (Bedrock), writes the result to S3, and rebuilds `_index.json`.

## Operation

**POST /contexts** — see [philkomarny/SkillStore#18](https://github.com/philkomarny/SkillStore/issues/18)

## Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Human-readable context name |
| `documents` | list[string] | yes | MD5 hashes of source documents (must all be `status: ready`) |
| `user_id` | string | no | Owner/author of this context |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 201 | `{"contextId": "ctx_...", "status": "ready"}` | Context created |
| 400 | `{"message": "..."}` | Missing fields or documents not ready |
| 500 | `{"message": "..."}` | Error |

## S3 Writes

```
s3://mskillsiq/eduskillsmp/contexts/<contextId>/metadata.json
s3://mskillsiq/eduskillsmp/contexts/<contextId>/output.json
s3://mskillsiq/eduskillsmp/contexts/_index.json  (rebuilt)
```
