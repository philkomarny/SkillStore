#!/usr/bin/env python
"""Return the raw SKILL.md content for a single skill slug.

Called when rendering skill detail pages and by the automated LLM review cron.
Returns the raw markdown string including YAML frontmatter.

Input (query string parameter or body field):
    slug  (str, required): the skill slug.

Output (found):
    { "statusCode": 200, "body": "<raw markdown string>" }

Output (not found):
    { "statusCode": 404, "body": { "message": "Skill not found: <slug>" } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operation 2: GET /skills/{slug}/content
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr, read_skill_content

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
    """Return raw SKILL.md content for *slug*.

    Input:
        slug  (str, required): skill slug; accepted as query string parameter
              or body field.

    Returns:
        200 with raw markdown string body if found.
        404 { message } if slug does not exist.
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

    content = read_skill_content(s3_client, logger, slug, bucket=BUCKET_NAME)
    if content is None:
        return _error(f"Skill not found: {slug}", status=404)

    logger.info(f"Returning content for slug={slug} ({len(content)} bytes)")
    return {
        "statusCode": 200,
        "headers": {**_CORS_HEADERS, "Content-Type": "text/markdown; charset=utf-8"},
        "body": content,
    }
