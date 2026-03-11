# esm-live-get-google-auth

Retrieves a Google OAuth user profile from S3 by user_id.

## API Gateway

**URL:** `https://q8fras08qd.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_google_auth_get`
**Method:** `GET`
**Parameters:** query string

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | yes | Google subject identifier |

## Responses

| Status | Body | Meaning |
|---|---|---|
| 200 | full profile object | Profile found |
| 404 | `{"message": "User not found: <user_id>"}` | No profile exists for this user |
| 500 | `{"message": "..."}` | S3 or validation failure |

### Profile object

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

### Get profile

```bash
curl "https://q8fras08qd.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_google_auth_get?user_id=108312345678901234567"
```

Response:
```json
{
  "user-id":        "108312345678901234567",
  "user-name":      "Jane Doe",
  "user-email":     "jane@example.com",
  "user-image-url": "https://lh3.googleusercontent.com/photo.jpg",
  "ts":             "2026-03-05T14:00:00+00:00"
}
```

### User not found

```bash
curl "https://q8fras08qd.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_google_auth_get?user_id=nonexistent"
```

Response:
```json
{"message": "User not found: nonexistent"}
```

### Missing user_id

```bash
curl "https://q8fras08qd.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_google_auth_get"
```

Response:
```json
{"statusCode": 500, "body": {"message": "Missing required parameter: user_id"}}
```
