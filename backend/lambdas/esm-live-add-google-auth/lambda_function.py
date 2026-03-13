#!/usr/bin/env python
"""Store or update a Google OAuth user profile in S3.

Upserts a single record per user at a fixed S3 key.  Callers should invoke
this after every successful Google sign-in to keep the profile current.

Storage path:
    s3://mskillsiq/eduskillsmp/auth/<user_id>.json

Record format:
    {
        "user-id":        <str>,
        "user-name":      <str>,
        "user-email":     <str>,
        "user-image-url": <str>,
        "ts":             <ISO-8601 timestamp>
    }

Input:
    {
        "user_id":        "108312345678901234567",
        "user_name":      "Jane Doe",
        "user_email":     "jane@example.com",
        "user_image_url": "https://lh3.googleusercontent.com/..."
    }

Output (success):
    {
        "statusCode": 200,
        "body":       null
    }

Output (error):
    {
        "statusCode": 500,
        "body": { "message": "<reason>" }
    }
"""

from json import dumps, loads
import os
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr, missing_param

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")
_LAMBDA_NAME = "esm-live-add-google-auth"
_KEY_PREFIX = "eduskillsmp/auth"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _missing_param(param: str) -> dict[str, Any]:
    return {"statusCode": 400, "headers": _CORS_HEADERS, "body": dumps({"message": f"Missing required parameter: '{param}'"})}


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Upsert a Google user profile record to S3.

    Input fields:
        user_id        (str, required): Google subject identifier.
        user_name      (str, required): Display name.
        user_email     (str, required): Email address.
        user_image_url (str, required): Profile image URL.

    Returns:
        200 with body null on success.
        500 with body {message} on any error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    # API Gateway proxy wraps POST body as a JSON string in event["body"]
    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
            logger.info("Parsed API Gateway body")
        except Exception as exc:
            msg = f"Invalid JSON body: {exc}"
            logger.error(msg)
            return {"statusCode": 400, "headers": _CORS_HEADERS, "body": dumps({"message": msg})}

    user_id: str = (params.get("user_id") or "").strip()
    if isnullstr(user_id):
        logger.error("Validation failed: missing required parameter 'user_id'")
        return _missing_param("user_id")

    user_name: str = (params.get("user_name") or "").strip()
    if isnullstr(user_name):
        logger.error("Validation failed: missing required parameter 'user_name'")
        return _missing_param("user_name")

    user_email: str = (params.get("user_email") or "").strip()
    if isnullstr(user_email):
        logger.error("Validation failed: missing required parameter 'user_email'")
        return _missing_param("user_email")

    user_image_url: str = (params.get("user_image_url") or "").strip()
    if isnullstr(user_image_url):
        logger.error("Validation failed: missing required parameter 'user_image_url'")
        return _missing_param("user_image_url")

    logger.info(f"Resolved Params: {dumps({'user_id': user_id, 'user_name': user_name, 'user_email': user_email, 'user_image_url': user_image_url})}")

    record = {
        "user-id": user_id,
        "user-name": user_name,
        "user-email": user_email,
        "user-image-url": user_image_url,
        "ts": datetime.now(tz=timezone.utc).isoformat(),
    }

    s3_key = f"{_KEY_PREFIX}/{user_id}.json"
    logger.info(f"Writing profile to s3://{BUCKET_NAME}/{s3_key}")

    try:
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=dumps(record),
            ContentType="application/json",
        )
        logger.info(f"S3 write OK: s3://{BUCKET_NAME}/{s3_key}")
    except Exception as exc:
        msg = f"S3 write FAILED for key '{s3_key}': {exc}"
        logger.error(msg)
        return {"statusCode": 500, "headers": _CORS_HEADERS, "body": dumps({"message": msg})}

    logger.info(f"Profile saved: user_id={user_id} email={user_email}")
    result = {"statusCode": 200, "headers": _CORS_HEADERS, "body": None}
    logger.info(f"Return Value: {dumps(result)}")
    return result
