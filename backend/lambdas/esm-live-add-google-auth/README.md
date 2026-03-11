# esm-live-add-google-auth

Upserts a Google OAuth user profile to S3. Call after every successful Google sign-in to keep the profile current.

## API Gateway

**URL:** `https://ju8k2ygpdc.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_google_auth_post`
**Method:** `POST`

## Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | yes | Google subject identifier (`session.user.id`) |
| `user_name` | string | yes | Display name (`session.user.name`) |
| `user_email` | string | yes | Email address (`session.user.email`) |
| `user_image_url` | string | yes | Profile image URL (`session.user.image`) |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | `null` | Profile saved successfully |
| 500 | `{"message": "..."}` | Validation or S3 failure |

## S3 Storage

Single file per user, overwritten on each call:

```
s3://mskillsiq/eduskillsmp/auth/<user_id>.json
```

Record format:
```json
{
  "user-id":        "108312345678901234567",
  "user-name":      "Jane Doe",
  "user-email":     "jane@example.com",
  "user-image-url": "https://lh3.googleusercontent.com/...",
  "ts":             "2026-03-05T14:00:00+00:00"
}
```

## Examples

### Save profile on sign-in

```bash
curl -X POST \
  "https://ju8k2ygpdc.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_google_auth_post" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":        "108312345678901234567",
    "user_name":      "Jane Doe",
    "user_email":     "jane@example.com",
    "user_image_url": "https://lh3.googleusercontent.com/photo.jpg"
  }'
```

Response:
```json
{"statusCode": 200, "body": null}
```

### Missing required field

```bash
curl -X POST \
  "https://ju8k2ygpdc.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_google_auth_post" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "108312345678901234567"}'
```

Response:
```json
{"statusCode": 500, "body": {"message": "Missing required parameter: user_name"}}
```
