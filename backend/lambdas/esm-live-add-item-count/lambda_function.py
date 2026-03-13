#!/usr/bin/env python
"""Record an item-count event to S3 for downstream analytics.

Invoked asynchronously by eduskillsmp to persist raw count events
(page views, clicks, etc.) with IP and timestamp for later aggregation.

Storage path:
    s3://mskillsiq/eduskillsmp/<count_type>/<slug>/<YYYYMMDD>/<UUID>.json

Record format:
    {
        "count":      <int>,
        "ip-address": <str>,
        "ts":         <ISO-8601 timestamp>,
        "user-id":    <str|null>
    }

Input:
    {
        "slug":       "intro-to-python",
        "count":      1,
        "ip_address": "203.0.113.42",
        "count_type": "view",
        "user_id":    "u-abc123"   (optional)
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
import uuid
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr, missing_param

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")
_LAMBDA_NAME = "esm-live-add-item-count"
_KEY_PREFIX = "eduskillsmp"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _date_str() -> str:
    """Return today's date in YYYYMMDD format (UTC)."""
    return datetime.now(tz=timezone.utc).strftime("%Y%m%d")


def _build_s3_key(count_type: str, slug: str) -> str:
    """Build the S3 object key for this event.

    Pattern: eduskillsmp/<count_type>/<slug>/<YYYYMMDD>/<UUID>.json
    """
    return f"{_KEY_PREFIX}/{count_type}/{slug}/{_date_str()}/{uuid.uuid4()}.json"


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def _missing_param(param: str) -> dict[str, Any]:
    return {"statusCode": 400, "headers": _CORS_HEADERS, "body": dumps({"message": f"Missing required parameter: '{param}'"})}


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Write a single count event record to S3.

    Input fields:
        slug       (str, required): identifier for the item being counted.
        count      (int, required): the count value to record.
        ip_address (str, required): originating IP address.
        count_type (str, required): category of count (e.g. "view", "click").
        user_id    (str, optional): authenticated user identifier; recorded as null if absent.

    Returns:
        200 with body null on success.
        500 with body {message} on any error.

    Note: Lambda is typically invoked asynchronously; status codes are
    returned anyway so synchronous callers can detect errors.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    # API Gateway proxy wraps POST body as a JSON string in event["body"]
    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
            logger.info("Parsed API Gateway body")
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)

    slug: str = (params.get("slug") or "").strip()
    if isnullstr(slug):
        logger.error("Validation failed: missing required parameter 'slug'")
        return _missing_param("slug")

    count_type: str = (params.get("count_type") or "").strip()
    if isnullstr(count_type):
        logger.error("Validation failed: missing required parameter 'count_type'")
        return _missing_param("count_type")

    ip_address: str = (params.get("ip_address") or "").strip()
    if isnullstr(ip_address):
        logger.error("Validation failed: missing required parameter 'ip_address'")
        return _missing_param("ip_address")

    raw_count = params.get("count")
    if raw_count is None:
        logger.error("Validation failed: missing required parameter 'count'")
        return _missing_param("count")
    if not isinstance(raw_count, int):
        return _error(f"'count' must be an int, got {type(raw_count).__name__}")

    user_id: str | None = (params.get("user_id") or "").strip() or None

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'count_type': count_type, 'ip_address': ip_address, 'count': raw_count, 'user_id': user_id})}")

    record = {
        "count": raw_count,
        "ip-address": ip_address,
        "ts": datetime.now(tz=timezone.utc).isoformat(),
        "user-id": user_id,
    }

    s3_key = _build_s3_key(count_type, slug)
    logger.info(f"Writing record to s3://{BUCKET_NAME}/{s3_key}")

    try:
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=dumps(record),
            ContentType="application/json",
        )
        logger.info(f"S3 write OK: s3://{BUCKET_NAME}/{s3_key}")
    except Exception as exc:
        return _error(f"S3 write FAILED for key '{s3_key}': {exc}")

    logger.info(f"Count event saved: {count_type}/{slug} count={raw_count} user_id={user_id}")
    result = {"statusCode": 200, "headers": _CORS_HEADERS, "body": None}
    logger.info(f"Return Value: {dumps(result)}")
    return result
