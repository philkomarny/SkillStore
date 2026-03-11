#!/usr/bin/env python
"""Return the published skill catalog index.

Reads the pre-built _index.json from S3 rather than scanning individual skill
files on every request, keeping latency constant regardless of catalog size.

The index is rebuilt by any Lambda that writes or deletes a skill:
  esm-live-add-skill-content, esm-live-update-skill-content,
  esm-live-delete-skill, esm-live-bulk-import-skills.

Input (query string parameters):
    status  (str, optional): pass "all" to include skills of every status
            (pending, in_review, rejected, deprecated, approved).  Omit or
            pass any other value to get approved skills only.

Output:
    { "statusCode": 200, "body": [ { slug, name, description, category,
                                      tags, version, verificationLevel,
                                      status }, ... ] }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operations 1 & 8:
    GET /skills          (published catalog)
    GET /skills?status=all  (admin — all statuses)
"""

from json import dumps
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, read_catalog_index, rebuild_catalog_index

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Return the catalog index from _index.json.

    Input:
        status  (str, optional query param): "all" returns all statuses;
                omit for approved-only.

    Returns:
        200 with JSON array of catalog entries.
        500 { message } on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    params = event.get("queryStringParameters") or {}
    include_all = (params.get("status") or "").strip().lower() == "all"

    # If admin view requested, rebuild on the fly to ensure freshness.
    # For standard catalog reads, serve the pre-built index.
    if include_all:
        rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME, include_all_statuses=True)

    entries = read_catalog_index(s3_client, logger, bucket=BUCKET_NAME)

    if not include_all:
        entries = [e for e in entries if e.get("status") == "approved"]

    logger.info(f"Returning {len(entries)} catalog entries (status_filter={'all' if include_all else 'approved'})")
    return {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps(entries),
    }
