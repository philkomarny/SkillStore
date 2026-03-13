#!/usr/bin/env python
"""Create metadata.json for a new skill slug without writing content.

Useful for reserving a slug or seeding metadata before content is ready.
If the slug already has metadata, returns 409 Conflict.

Input:
    slug                (str, required): kebab-case skill identifier.
    name                (str, required): display name.
    description         (str, required): one-sentence description.
    category            (str, required): department slug (e.g. "it-operations").
    tags                (list, required): list of kebab-case tag strings.
    by                  (str, required): Google OAuth subject ID or system actor.
    version             (str, optional): semver string; defaults to "1.0.0".
    verification_level  (int, optional): 0, 1, or 2; defaults to 0.
    status              (str, optional): defaults to "pending".

Output (success):
    { "statusCode": 201, "body": { "slug": "<slug>" } }

Output (conflict):
    { "statusCode": 409, "body": { "message": "Skill metadata already exists: <slug>" } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#41
"""

from json import dumps, loads
import os
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3

from skillstore_base import (
    configure_logger,
    isnullstr,
    skill_exists,
    write_skill_metadata,
    append_lineage_event,
    rebuild_catalog_index,
)

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Create metadata.json for a new skill slug.

    Returns:
        201 { slug } on success.
        409 { message } if slug already exists.
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

    name: str = (params.get("name") or "").strip()
    if isnullstr(name):
        return _error("Missing required parameter: 'name'", status=400)

    description: str = (params.get("description") or "").strip()
    if isnullstr(description):
        return _error("Missing required parameter: 'description'", status=400)

    category: str = (params.get("category") or "").strip()
    if isnullstr(category):
        return _error("Missing required parameter: 'category'", status=400)

    tags = params.get("tags") or []
    if not isinstance(tags, list):
        return _error("'tags' must be a list", status=400)

    by: str = (params.get("by") or "").strip()
    if isnullstr(by):
        return _error("Missing required parameter: 'by'", status=400)

    version: str = (params.get("version") or "1.0.0").strip()
    verification_level: int = params.get("verification_level", 0)
    if verification_level not in (0, 1, 2):
        return _error("'verification_level' must be 0, 1, or 2", status=400)

    status_val: str = (params.get("status") or "pending").strip()

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'name': name, 'category': category, 'by': by, 'verification_level': verification_level})}")

    if skill_exists(s3_client, logger, slug, bucket=BUCKET_NAME):
        return _error(f"Skill metadata already exists: {slug}", status=409)

    metadata = {
        "slug": slug,
        "name": name,
        "description": description,
        "category": category,
        "tags": tags,
        "version": version,
        "verification_level": verification_level,
        "status": status_val,
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
        "created_by": by,
    }

    write_skill_metadata(s3_client, logger, slug, metadata, bucket=BUCKET_NAME)
    append_lineage_event(
        s3_client, logger, slug,
        action="metadata_created",
        status=status_val,
        verification_level=verification_level,
        by=by,
        bucket=BUCKET_NAME,
    )
    rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME)

    logger.info(f"Skill metadata created: {slug} by {by}")
    result = {
        "statusCode": 201,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug}),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
