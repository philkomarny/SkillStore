#!/usr/bin/env python
"""Retrieve a Google OAuth user profile from S3.

Reads the single profile record stored at eduskillsmp/auth/<user_id>.json.
Returns 404 when no record exists for the given user_id.

Storage path:
    s3://mskillsiq/eduskillsmp/auth/<user_id>.json

Input:
    {
        "user_id": "108312345678901234567"
    }

Output (success):
    {
        "statusCode": 200,
        "body": {
            "user-id":        "108312345678901234567",
            "user-name":      "Jane Doe",
            "user-email":     "jane@example.com",
            "user-image-url": "https://lh3.googleusercontent.com/...",
            "ts":             "2026-03-05T14:00:00+00:00"
        }
    }

Output (not found):
    {
        "statusCode": 404,
        "body": { "message": "User not found: <user_id>" }
    }

Output (error):
    {
        "statusCode": 500,
        "body": { "message": "<reason>" }
    }
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3
from botocore.exceptions import ClientError

from skillstore_base import configure_logger, isnullstr, missing_param

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")
_LAMBDA_NAME = "esm-live-get-google-auth"
_KEY_PREFIX = "eduskillsmp/auth"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _missing_param(param: str) -> dict[str, Any]:
    return {"statusCode": 400, "headers": _CORS_HEADERS, "body": dumps({"message": f"Missing required parameter: '{param}'"})}


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Retrieve a Google user profile from S3.

    Input fields (query string or direct):
        user_id (str, required): Google subject identifier.

    Returns:
        200 with full profile record on success.
        404 when no profile exists for the given user_id.
        500 on S3 or parse error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    params = event.get("queryStringParameters") or event

    user_id: str = (params.get("user_id") or "").strip()
    if isnullstr(user_id):
        logger.error("Validation failed: missing required parameter 'user_id'")
        return _missing_param("user_id")

    logger.info(f"Resolved Params: {dumps({'user_id': user_id})}")

    s3_key = f"{_KEY_PREFIX}/{user_id}.json"
    logger.info(f"Reading profile from s3://{BUCKET_NAME}/{s3_key}")

    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        record = loads(response["Body"].read().decode("utf-8"))
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("NoSuchKey", "404"):
            msg = f"User not found: {user_id}"
            logger.info(msg)
            return {"statusCode": 404, "headers": _CORS_HEADERS, "body": dumps({"message": msg})}
        msg = f"S3 read failed for key '{s3_key}': {exc}"
        logger.error(msg)
        return {"statusCode": 500, "headers": _CORS_HEADERS, "body": dumps({"message": msg})}
    except Exception as exc:
        msg = f"S3 read failed for key '{s3_key}': {exc}"
        logger.error(msg)
        return {"statusCode": 500, "headers": _CORS_HEADERS, "body": dumps({"message": msg})}

    result = {"statusCode": 200, "headers": _CORS_HEADERS, "body": dumps(record)}
    logger.info(f"Return Value: {dumps(result)}")
    return result
