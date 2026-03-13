#!/usr/bin/env python
"""Partial update of metadata.json fields for an existing skill.

Reads the current metadata, merges in the provided fields, writes back,
appends a lineage event, and rebuilds _index.json.  Only the supplied
fields are updated — omitted fields are preserved.

This is the Lambda the cron (review-queue) will call to promote
verification_level from 0 → 1 in S3, replacing the Supabase-only write.

Input:
    slug                (str, required): skill slug to update.
    by                  (str, required): Google OAuth subject ID or system actor.
    verification_level  (int, optional): 0, 1, or 2.
    status              (str, optional): e.g. "approved", "pending", "deprecated".
    name                (str, optional): updated display name.
    description         (str, optional): updated description.
    category            (str, optional): updated department slug.
    tags                (list, optional): updated tag list.
    version             (str, optional): updated semver.
    submitted_by        (str, optional): Google OAuth subject ID of submitter.
    note                (str, optional): free-text note for the lineage event.

Output (success):
    { "statusCode": 200, "body": { "slug": "<slug>", "updated": ["field1", ...] } }

Output (not found):
    { "statusCode": 404, "body": { "message": "Skill not found: <slug>" } }

Output (no changes):
    { "statusCode": 200, "body": { "slug": "<slug>", "updated": [] } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#41, philkomarny/SkillStore#47
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
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

_UPDATABLE_FIELDS = {
    "verification_level", "status", "name", "description",
    "category", "tags", "version", "submitted_by",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Partial-update metadata.json for an existing skill.

    Returns:
        200 { slug, updated } on success.
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

    # Validate verification_level if provided
    if "verification_level" in params:
        vl = params["verification_level"]
        if vl not in (0, 1, 2):
            return _error("'verification_level' must be 0, 1, or 2", status=400)

    # Validate tags if provided
    if "tags" in params and not isinstance(params["tags"], list):
        return _error("'tags' must be a list", status=400)

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'by': by})}")

    if not skill_exists(s3_client, logger, slug, bucket=BUCKET_NAME):
        return _error(f"Skill not found: {slug}", status=404)

    meta = read_skill_metadata(s3_client, logger, slug, bucket=BUCKET_NAME) or {}

    # Merge only the fields that were explicitly provided
    updated_fields: list[str] = []
    for field in _UPDATABLE_FIELDS:
        if field in params:
            old_val = meta.get(field)
            new_val = params[field]
            if old_val != new_val:
                meta[field] = new_val
                updated_fields.append(field)

    if updated_fields:
        write_skill_metadata(s3_client, logger, slug, meta, bucket=BUCKET_NAME)
        append_lineage_event(
            s3_client, logger, slug,
            action="metadata_updated",
            status=meta.get("status", "approved"),
            verification_level=meta.get("verification_level", 0),
            by=by,
            note=note or f"updated: {', '.join(sorted(updated_fields))}",
            bucket=BUCKET_NAME,
        )
        rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME)
        logger.info(f"Skill metadata updated: {slug} fields={updated_fields} by {by}")
    else:
        logger.info(f"No changes for {slug}")

    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug, "updated": sorted(updated_fields)}),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
