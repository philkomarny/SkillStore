#!/usr/bin/env python
"""Check whether a skill slug exists in the catalog.

Returns 200 if the slug exists, 404 if not.  Used by sync scripts to guard
against re-importing or updating skills that have not yet been seeded.

S3 existence is determined by a head_object call on the slug's metadata.json.

Input (query string parameter or body field):
    slug  (str, required): the skill slug to check.

Output (exists):
    { "statusCode": 200, "body": { "slug": "<slug>", "exists": true } }

Output (not found):
    { "statusCode": 404, "body": { "slug": "<slug>", "exists": false } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operation 5: GET /skills/{slug}
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr, skill_exists

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
    """Return 200 if the slug exists in the catalog, 404 if not.

    Input:
        slug  (str, required): skill slug; accepted as query string parameter
              or body field.

    Returns:
        200 { slug, exists: true } if found.
        404 { slug, exists: false } if not found.
        500 { message } on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    params = event.get("queryStringParameters") or {}
    if isinstance(event.get("body"), str):
        try:
            params = {**params, **loads(event["body"])}
        except Exception:
            pass

    slug: str = (params.get("slug") or "").strip()
    if isnullstr(slug):
        return _error("Missing required parameter: 'slug'", status=400)

    exists = skill_exists(s3_client, logger, slug, bucket=BUCKET_NAME)
    status_code = 200 if exists else 404
    return {
        "statusCode": status_code,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug, "exists": exists}),
    }
