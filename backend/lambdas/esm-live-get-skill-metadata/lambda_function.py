#!/usr/bin/env python
"""Return the full metadata.json for a skill slug.

Unlike esm-live-get-skill (which only checks existence), this returns the
complete metadata record including verification_level, status, tags, etc.

Input (query string or body):
    slug  (str, required): the skill slug to look up.

Output (success):
    { "statusCode": 200, "body": { "slug": "...", "name": "...", ... } }

Output (not found):
    { "statusCode": 404, "body": { "message": "Skill not found: <slug>" } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#41
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr, read_skill_metadata

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
    """Return full metadata.json for a skill slug.

    Input:
        slug  (str, required): accepted as query string parameter or body field.

    Returns:
        200 { ...metadata } on success.
        404 { message } if not found.
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

    logger.info(f"Resolved Params: {dumps({'slug': slug})}")

    metadata = read_skill_metadata(s3_client, logger, slug, bucket=BUCKET_NAME)
    if metadata is None:
        return _error(f"Skill not found: {slug}", status=404)

    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps(metadata),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
