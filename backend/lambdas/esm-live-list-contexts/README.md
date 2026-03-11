# esm-live-list-contexts

Returns all contexts from the pre-built index, optionally filtered by owner.

## Operation

**GET /contexts** — see [philkomarny/SkillStore#18](https://github.com/philkomarny/SkillStore/issues/18)

## Input

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user_id` | string (query) | no | Filter to contexts owned by this user |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `[{"contextId", "name", "status", "createdAt"}, ...]` | Context list |
| 500 | `{"message": "..."}` | Error |
