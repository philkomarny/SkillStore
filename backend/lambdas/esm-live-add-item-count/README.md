# esm-live-add-item-count

Records a single item-count event to S3 for downstream aggregation. Invoked asynchronously by eduskillsmp when a user view, click, or other trackable action occurs.

## API Gateway

**URL:** `https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post`
**Method:** `POST`

## Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | yes | Item identifier (e.g. `"intro-to-python"`) |
| `count` | int | yes | Count value to record |
| `ip_address` | string | yes | Originating IP address |
| `count_type` | string | yes | Event category (e.g. `"view"`, `"click"`) |
| `user_id` | string | no | Authenticated user ID; stored as `null` if omitted |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `null` | Record written successfully |
| 500 | `{"message": "..."}` | Validation or S3 write failure |

## S3 Storage

Each event is written to:
```
s3://mskillsiq/eduskillsmp/<count_type>/<slug>/<YYYYMMDD>/<UUID>.json
```

Record format:
```json
{
  "count": 1,
  "ip-address": "203.0.113.42",
  "ts": "2026-03-05T14:00:00+00:00",
  "user-id": "u-abc123"
}
```

## Examples

### Record a page view

```bash
curl -X POST \
  https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "intro-to-python",
    "count": 1,
    "ip_address": "203.0.113.42",
    "count_type": "view"
  }'
```

### Record a view with authenticated user

```bash
curl -X POST \
  https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "intro-to-python",
    "count": 1,
    "ip_address": "203.0.113.42",
    "count_type": "view",
    "user_id": "u-abc123"
  }'
```

### Record a click event

```bash
curl -X POST \
  https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "data-analytics-certificate",
    "count": 1,
    "ip_address": "198.51.100.7",
    "count_type": "click"
  }'
```
