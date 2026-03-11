# esm-live-get-item-count

Returns the total count for a given slug and count-type. Pass `verbose=true` to include all raw records.

## API Gateway

**URL:** `https://iw0ojycun6.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_item_count_get`
**Method:** `GET`
**Parameters:** query string

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `slug` | string | yes | Item identifier (e.g. `"intro-to-python"`) |
| `count_type` | string | yes | Event category (e.g. `"view"`, `"click"`) |
| `verbose` | string | no | Pass `"true"` to include all raw records |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"total": <int>}` | Success (default) |
| 200 | `{"total": <int>, "records": [...]}` | Success with verbose=true |
| 500 | `{"message": "..."}` | S3 or validation failure |

### Record tuple format (verbose mode)

Each record is a 4-element array: `[count, ip_address, ts, user_id]`

```json
[1, "203.0.113.42", "2026-03-05T14:00:00+00:00", "u-abc123"]
[1, "198.51.100.7",  "2026-03-05T14:01:00+00:00", null]
```

## Examples

### Get total view count

```bash
curl "https://iw0ojycun6.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_item_count_get?slug=intro-to-python&count_type=view"
```

Response:
```json
{"total": 42}
```

### Get full report

```bash
curl "https://iw0ojycun6.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_item_count_get?slug=intro-to-python&count_type=view&verbose=true"
```

Response:
```json
{
  "total": 42,
  "records": [
    [1, "203.0.113.42", "2026-03-05T14:00:00+00:00", "u-abc123"],
    [1, "198.51.100.7",  "2026-03-04T09:15:00+00:00", null]
  ]
}
```

### Slug with no records

```bash
curl "https://iw0ojycun6.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_item_count_get?slug=nonexistent&count_type=view"
```

Response:
```json
{"total": 0}
```
