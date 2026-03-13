#!/usr/bin/env python
"""Store a new community skill submission to the catalog.

Creates three S3 objects for the slug (content.md, metadata.json,
lineage.json) then rebuilds _index.json.  Skills are created with
status="pending" and verification_level=0 — they do not appear in
the public catalog until approved.

Input:
    slug         (str, required): kebab-case skill identifier.
    content      (str, required): raw markdown including YAML frontmatter.
    name         (str, required): display name.
    description  (str, required): one-sentence description.
    category     (str, required): department slug (e.g. "it-operations").
    tags         (list, required): list of kebab-case tag strings.
    author_id    (str, required): Google OAuth subject ID of submitter.
    author_name  (str, optional): display name of submitter.
    version      (str, optional): semantic version string; defaults to "1.0.0".

Output (success):
    { "statusCode": 201, "body": { "slug": "<slug>" } }

Output (conflict — slug already exists):
    { "statusCode": 409, "body": { "message": "Skill already exists: <slug>" } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operation 3: POST /skills/{slug}/content
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
    write_skill_content,
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
    """Create a new skill in the catalog.

    Input fields (all required unless noted):
        slug         (str): kebab-case identifier.
        content      (str): raw markdown with YAML frontmatter.
        name         (str): display name.
        description  (str): one-sentence description.
        category     (str): department slug.
        tags         (list): kebab-case tag strings.
        author_id    (str): Google OAuth subject ID.
        author_name  (str, optional): display name of submitter.
        version      (str, optional): semver string; default "1.0.0".

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

    content: str = params.get("content") or ""
    if isnullstr(content):
        return _error("Missing required parameter: 'content'", status=400)

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

    author_id: str = (params.get("author_id") or "").strip()
    if isnullstr(author_id):
        return _error("Missing required parameter: 'author_id'", status=400)

    author_name: str | None = (params.get("author_name") or "").strip() or None
    version: str = (params.get("version") or "1.0.0").strip()

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'name': name, 'description': description, 'category': category, 'tags': tags, 'author_id': author_id, 'author_name': author_name, 'version': version})}")

    if skill_exists(s3_client, logger, slug, bucket=BUCKET_NAME):
        return _error(f"Skill already exists: {slug}", status=409)

    metadata = {
        "slug": slug,
        "name": name,
        "description": description,
        "category": category,
        "tags": tags,
        "version": version,
        "author_id": author_id,
        "author_name": author_name,
        "source": "community",
        "status": "pending",
        "verification_level": 0,
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
    }

    write_skill_content(s3_client, logger, slug, content, bucket=BUCKET_NAME)
    write_skill_metadata(s3_client, logger, slug, metadata, bucket=BUCKET_NAME)
    append_lineage_event(
        s3_client, logger, slug,
        action="created",
        status="pending",
        verification_level=0,
        by=author_id,
        bucket=BUCKET_NAME,
    )
    rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME)

    logger.info(f"Skill created: {slug} by {author_id}")
    result = {
        "statusCode": 201,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug}),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
