#!/usr/bin/env python
"""Update the markdown content of an existing skill.

Overwrites content.md, appends a content_updated event to lineage.json,
and rebuilds _index.json.  Used by the sync script that periodically pulls
updated SKILL.md files from the GitHub source.

Does not modify metadata.json (name, category, tags, etc.) — use a separate
metadata update flow for those fields.

Input:
    slug     (str, required): the skill slug to update.
    content  (str, required): new raw markdown including YAML frontmatter.
    by       (str, required): Google OAuth subject ID or system actor name
             performing the update (e.g. "sync-bot").

Output (success):
    { "statusCode": 200, "body": { "slug": "<slug>" } }

Output (not found):
    { "statusCode": 404, "body": { "message": "Skill not found: <slug>" } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operation 6: PUT /skills/{slug}/content
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import (
    configure_logger,
    isnullstr,
    skill_exists,
    write_skill_content,
    append_lineage_event,
    rebuild_catalog_index,
    read_skill_metadata,
)

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "PUT,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Update content.md for an existing skill.

    Input fields:
        slug     (str, required): skill slug.
        content  (str, required): new raw markdown with YAML frontmatter.
        by       (str, required): actor performing the update.

    Returns:
        200 { slug } on success.
        404 { message } if slug not found.
        500 { message } on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)

    slug: str = (params.get("slug") or "").strip()
    if isnullstr(slug):
        return _error("Missing required parameter: 'slug'", status=400)

    content: str = params.get("content") or ""
    if isnullstr(content):
        return _error("Missing required parameter: 'content'", status=400)

    by: str = (params.get("by") or "").strip()
    if isnullstr(by):
        return _error("Missing required parameter: 'by'", status=400)

    if not skill_exists(s3_client, logger, slug, bucket=BUCKET_NAME):
        return _error(f"Skill not found: {slug}", status=404)

    meta = read_skill_metadata(s3_client, logger, slug, bucket=BUCKET_NAME) or {}
    current_status = meta.get("status", "approved")
    current_vl = meta.get("verification_level", 0)

    write_skill_content(s3_client, logger, slug, content, bucket=BUCKET_NAME)
    append_lineage_event(
        s3_client, logger, slug,
        action="content_updated",
        status=current_status,
        verification_level=current_vl,
        by=by,
        bucket=BUCKET_NAME,
    )
    rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME)

    logger.info(f"Skill content updated: {slug} by {by}")
    return {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug}),
    }
