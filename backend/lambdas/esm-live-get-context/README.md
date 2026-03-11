# esm-live-get-context

Retrieves a context by ID. Use as a polling endpoint after `POST /contexts`.

Returns metadata and, when `status: ready`, the synthesised markdown.

## Operation

**GET /contexts/{contextId}** — see [philkomarny/SkillStore#18](https://github.com/philkomarny/SkillStore/issues/18)

## Input

`contextId` accepted as path parameter, query string, or JSON body field.

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"contextId", "name", "status": "building"}` | Still synthesising |
| 200 | `{"contextId", "name", "status": "ready", "markdown", "documents", "createdAt"}` | Ready |
| 400 | `{"message": "..."}` | Missing contextId |
| 404 | `{"message": "..."}` | Context not found |
| 500 | `{"message": "..."}` | Error |
