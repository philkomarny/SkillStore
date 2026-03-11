#!/usr/bin/env python
"""Deprecate a skill, removing it from the public catalog.

Marks the skill as deprecated by:
  1. Appending a "deprecated" event to lineage.json.
  2. Updating metadata.json status to "deprecated".
  3. Rebuilding _index.json (deprecated skills are excluded from approved view).

The S3 files (content.md, metadata.json, lineage.json) are retained for audit
purposes.  A skill can be restored by calling esm-live-update-skill-content
and manually setting status back to "approved" via a metadata update.

Input:
    slug  (str, required): the skill slug to deprecate.
    by    (str, required): Google OAuth subject ID or system actor name.
    note  (str, optional): reason for deprecation.

Output (success):
    { "statusCode": 200, "body": { "slug": "<slug>" } }

Output (not found):
    { "statusCode": 404, "body": { "message": "Skill not found: <slug>" } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operation 7: DELETE /skills/{slug}
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
    read_skill_metadata,
    write_skill_metadata,
    append_lineage_event,
    rebuild_catalog_index,
)

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "DELETE,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Deprecate a skill slug.

    Input fields:
        slug  (str, required): skill slug.
        by    (str, required): actor performing the deprecation.
        note  (str, optional): deprecation reason.

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

    by: str = (params.get("by") or "").strip()
    if isnullstr(by):
        return _error("Missing required parameter: 'by'", status=400)

    note: str | None = (params.get("note") or "").strip() or None

    if not skill_exists(s3_client, logger, slug, bucket=BUCKET_NAME):
        return _error(f"Skill not found: {slug}", status=404)

    meta = read_skill_metadata(s3_client, logger, slug, bucket=BUCKET_NAME) or {}
    meta["status"] = "deprecated"
    current_vl = meta.get("verification_level", 0)

    write_skill_metadata(s3_client, logger, slug, meta, bucket=BUCKET_NAME)
    append_lineage_event(
        s3_client, logger, slug,
        action="deprecated",
        status="deprecated",
        verification_level=current_vl,
        by=by,
        note=note,
        bucket=BUCKET_NAME,
    )
    rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME)

    logger.info(f"Skill deprecated: {slug} by {by}")
    return {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug}),
    }
