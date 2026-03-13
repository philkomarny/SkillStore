#!/usr/bin/env python
"""Sum all count events for a given slug and count-type from S3.

Reads every record under eduskillsmp/<count_type>/<slug>/ and returns the
total count. Uses a thread pool for parallel S3 GETs.

Storage path pattern:
    s3://mskillsiq/eduskillsmp/<count_type>/<slug>/<YYYYMMDD>/<UUID>.json

Each record:
    {"count": <int>, "ip-address": <str>, "ts": <str>, "user-id": <str|null>}

Input:
    {
        "slug":       "intro-to-python",
        "count_type": "view",
        "verbose":    "true"   (optional)
    }

Output (default / verbose=false):
    {
        "statusCode": 200,
        "body": { "total": 42 }
    }

Output (verbose=true):
    {
        "statusCode": 200,
        "body": {
            "total": 42,
            "records": [
                [1, "203.0.113.42", "2026-03-05T14:00:00+00:00", "u-abc123"],
                [1, "198.51.100.7",  "2026-03-05T14:01:00+00:00", null]
            ]
        }
    }

    Record tuple positions: [count, ip_address, ts, user_id]

Output (error):
    {
        "statusCode": 500,
        "body": { "message": "<reason>" }
    }
"""

from json import dumps, loads
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr, missing_param

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")
_LAMBDA_NAME = "esm-live-get-item-count"
_KEY_PREFIX = "eduskillsmp"
_MAX_WORKERS = 20

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
# S3 helpers
# ---------------------------------------------------------------------------


def _list_keys(prefix: str) -> list[str]:
    """List all S3 object keys under prefix (handles pagination)."""
    keys = []
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix):
        for obj in page.get("Contents", []):
            keys.append(obj["Key"])
    return keys


def _read_record(key: str) -> tuple[int, str | None, str | None, str | None] | None:
    """Fetch one S3 record and return (count, ip_address, ts, user_id).

    Returns None on any read/parse error (logged as error).
    """
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
        r = loads(response["Body"].read().decode("utf-8"))
        return (
            int(r.get("count", 0)),
            r.get("ip-address"),
            r.get("ts"),
            r.get("user-id"),
        )
    except Exception as exc:
        logger.error(f"S3 read FAILED for key '{key}': {exc}")
        return None


def _fetch_all(keys: list[str]) -> list[tuple]:
    """Fetch all records in parallel. Failed reads are logged and excluded from results."""
    if not keys:
        return []
    results = []
    with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as pool:
        futures = {pool.submit(_read_record, k): k for k in keys}
        for future in as_completed(futures):
            rec = future.result()
            if rec is not None:
                results.append(rec)
    return results


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Return the total item count (and optionally all records) for a slug/count-type.

    Input fields:
        slug       (str,  required): identifier for the item.
        count_type (str,  required): category of count (e.g. "view", "click").
        verbose    (str,  optional): pass "true" to include all raw records.

    Returns:
        200 with body {"total": <int>} by default.
        200 with body {"total": <int>, "records": [[count, ip, ts, user_id], ...]}
            when verbose=true.
        500 with body {message} on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    # Support both direct invocation (body fields) and API Gateway GET (queryStringParameters)
    params = event.get("queryStringParameters") or event

    slug: str = (params.get("slug") or "").strip()
    if isnullstr(slug):
        logger.error("Validation failed: missing required parameter 'slug'")
        return _missing_param("slug")

    count_type: str = (params.get("count_type") or "").strip()
    if isnullstr(count_type):
        logger.error("Validation failed: missing required parameter 'count_type'")
        return _missing_param("count_type")

    verbose: bool = str(params.get("verbose") or "").strip().lower() == "true"

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'count_type': count_type, 'verbose': verbose})}")

    prefix = f"{_KEY_PREFIX}/{count_type}/{slug}/"
    logger.info(f"Listing keys under s3://{BUCKET_NAME}/{prefix} (verbose={verbose})")

    try:
        keys = _list_keys(prefix)
    except Exception as exc:
        msg = f"S3 list FAILED for prefix '{prefix}': {exc}"
        logger.error(msg)
        return {"statusCode": 500, "headers": _CORS_HEADERS, "body": dumps({"message": msg})}

    logger.info(f"Found {len(keys)} key(s) under prefix")

    try:
        records = _fetch_all(keys)
    except Exception as exc:
        msg = f"Record fetch FAILED: {exc}"
        logger.error(msg)
        return {"statusCode": 500, "headers": _CORS_HEADERS, "body": dumps({"message": msg})}

    failed = len(keys) - len(records)
    if failed:
        logger.error(f"{failed} of {len(keys)} record(s) failed to read and were excluded from total")

    total = sum(r[0] for r in records)
    logger.info(f"Result: total={total} records={len(records)} failed={failed} slug={count_type}/{slug}")

    body: dict[str, Any] = {"total": total}
    if verbose:
        body["records"] = [list(r) for r in records]

    result = {"statusCode": 200, "headers": _CORS_HEADERS, "body": dumps(body)}
    logger.info(f"Return Value: {dumps(result)}")
    return result
