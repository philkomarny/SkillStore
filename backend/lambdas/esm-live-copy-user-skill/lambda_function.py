#!/usr/bin/env python
"""Copy a catalog skill into a user's personal Refinery.

Reads the skill's content.md and metadata.json from the global catalog
(``eduskillsmp/skill-catalog/<slug>/``), then writes an initial v1.md
and metadata.json to the user's Refinery prefix
(``eduskillsmp/user-skills/<user_id>/<slug>/``).

If the user already has this skill, returns the existing metadata with
``already_exists: true`` — no duplicate storage.

Input (JSON body):
    slug     (str, required): kebab-case skill identifier from the catalog.
    user_id  (str, required): caller's identity (Google OAuth subject ID).

Output (201 — new copy):
    { "slug": "<slug>", "version": 1, "already_exists": false }

Output (200 — already copied):
    { "slug": "<slug>", "version": <n>, "already_exists": true }

Output (400):  missing / invalid parameters.
Output (404):  skill not found in catalog.
Output (500):  storage failure.

Related: philkomarny/SkillStore#30
"""

from json import dumps, loads
import os
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3
from botocore.exceptions import ClientError

from skillstore_base import (
    configure_logger,
    isnullstr,
    validate_google_sub,
    read_skill_metadata,
    read_skill_content,
)

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# S3 layout — philkomarny/SkillStore#30:
#   Catalog source:   eduskillsmp/skill-catalog/<slug>/content.md
#                     eduskillsmp/skill-catalog/<slug>/metadata.json
#   User Refinery:    eduskillsmp/user-skills/<user_id>/<slug>/metadata.json
#                     eduskillsmp/user-skills/<user_id>/<slug>/v1.md
_USER_SKILLS_PREFIX = "eduskillsmp/user-skills"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _metadata_key(user_id: str, slug: str) -> str:
    """Return the S3 key for a user-skill's metadata JSON."""
    return f"{_USER_SKILLS_PREFIX}/{user_id}/{slug}/metadata.json"


def _content_key(user_id: str, slug: str, version: int) -> str:
    """Return the S3 key for a user-skill's content at a given version."""
    return f"{_USER_SKILLS_PREFIX}/{user_id}/{slug}/v{version}.md"


def _user_skill_exists(user_id: str, slug: str) -> dict | None:
    """Return existing metadata if the user already has this skill, else None."""
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_metadata_key(user_id, slug))
        return loads(obj["Body"].read())
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return None
        raise


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Copy a catalog skill to the user's Refinery.

    Args:
        event: Lambda invocation event with JSON body fields.

    Returns:
        201 { slug, version, already_exists } for new copies.
        200 { slug, version, already_exists } for duplicates.
        400 { message } for missing/invalid parameters.
        404 { message } when skill not in catalog.
        500 { message } on storage failure.
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

    user_id: str = (params.get("user_id") or "").strip()
    err = validate_google_sub(user_id)
    if err:
        return _error(err, status=400)

    # Dedup: if user already has this skill, return existing.
    existing = _user_skill_exists(user_id, slug)
    if existing:
        logger.info(f"User {user_id} already has skill {slug}")
        return {
            "statusCode": 200,
            "headers": _CORS_HEADERS,
            "body": dumps({
                "slug": slug,
                "version": existing.get("version", 1),
                "already_exists": True,
            }),
        }

    # Read catalog skill.
    catalog_meta = read_skill_metadata(s3_client, logger, slug, bucket=BUCKET_NAME)
    if catalog_meta is None:
        return _error(f"Skill not found in catalog: {slug}", status=404)

    catalog_content = read_skill_content(s3_client, logger, slug, bucket=BUCKET_NAME)
    if catalog_content is None:
        return _error(f"Skill content not found in catalog: {slug}", status=404)

    # Write v1.md (initial copy of catalog content).
    now = datetime.now(tz=timezone.utc).isoformat()
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_content_key(user_id, slug, 1),
        Body=catalog_content.encode("utf-8"),
        ContentType="text/markdown; charset=utf-8",
    )

    # Write user-skill metadata.
    user_meta = {
        "slug": slug,
        "base_skill_slug": slug,
        "name": catalog_meta.get("name", slug),
        "description": catalog_meta.get("description", ""),
        "category": catalog_meta.get("category", ""),
        "tags": catalog_meta.get("tags", []),
        "version": 1,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_metadata_key(user_id, slug),
        Body=dumps(user_meta, indent=2),
        ContentType="application/json",
    )

    logger.info(f"Copied skill {slug} to Refinery for user {user_id}")
    return {
        "statusCode": 201,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug, "version": 1, "already_exists": False}),
    }
