# esm-live-delete-context

Deletes a context and removes it from the index.

Source documents are not affected — only `metadata.json` and `output.json` for the context are removed.

## Operation

**DELETE /contexts/{contextId}** — see [philkomarny/SkillStore#18](https://github.com/philkomarny/SkillStore/issues/18)

## Input

`contextId` accepted as path parameter, query string, or JSON body field.

## Responses

| Status | Body | Meaning |
|---|---|---|
| 204 | (empty) | Context deleted |
| 400 | `{"message": "..."}` | Missing contextId |
| 404 | `{"message": "..."}` | Context not found |
| 500 | `{"message": "..."}` | Error |

## S3 Deletes

```
s3://mskillsiq/eduskillsmp/contexts/<contextId>/metadata.json
s3://mskillsiq/eduskillsmp/contexts/<contextId>/output.json
s3://mskillsiq/eduskillsmp/contexts/_index.json  (rebuilt)
```
