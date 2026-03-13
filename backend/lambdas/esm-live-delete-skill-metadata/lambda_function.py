#!/usr/bin/env python
"""Hard-delete metadata.json for a skill slug.

Unlike esm-live-delete-skill (which soft-deprecates by setting status),
this permanently removes the metadata.json file from S3.  The content.md
and lineage.json files are preserved for audit.

After deletion, rebuilds _index.json so the skill no longer appears in
the catalog.

Input:
    slug  (str, required): the skill slug whose metadata to delete.
    by    (str, required): Google OAuth subject ID or system actor.
    note  (str, optional): reason for deletion.

Output (success):
    { "statusCode": 200, "body": { "slug": "<slug>" } }

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

from skillstore_base import (
    catalog_meta_key,
    configure_logger,
    isnullstr,
    skill_exists,
    read_skill_metadata,
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
    """Hard-delete metadata.json for a skill slug.

    Input fields:
        slug  (str, required): skill slug.
        by    (str, required): actor performing the deletion.
        note  (str, optional): reason for deletion.

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

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'by': by, 'note': note})}")

    if not skill_exists(s3_client, logger, slug, bucket=BUCKET_NAME):
        return _error(f"Skill not found: {slug}", status=404)

    meta = read_skill_metadata(s3_client, logger, slug, bucket=BUCKET_NAME) or {}
    current_vl = meta.get("verification_level", 0)

    # Append lineage event before deleting metadata
    append_lineage_event(
        s3_client, logger, slug,
        action="metadata_deleted",
        status="deleted",
        verification_level=current_vl,
        by=by,
        note=note,
        bucket=BUCKET_NAME,
    )

    # Hard-delete the metadata.json file
    key = catalog_meta_key(slug)
    s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
    logger.info(f"Deleted metadata: {key}")

    rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME)

    logger.info(f"Skill metadata deleted: {slug} by {by}")
    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug}),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
