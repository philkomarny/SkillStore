#!/usr/bin/env python
"""Update a user-skill's content and metadata in S3.

Writes a new version of the skill content (``v<n>.md``) and updates
``metadata.json`` in the user's Refinery prefix
(``eduskillsmp/skills/user/<user_id>/<slug>/``).

Used by the refine flow to persist AI-refined skill content (#39).

Input (JSON body):
    slug             (str, required): kebab-case skill identifier.
    user_id          (str, required): caller's identity (Google OAuth subject ID).
    content          (str, required): new markdown content for the skill.
    version          (int, required): new version number.
    status           (str, optional): new status (default: "refined").
    context_summary  (str, optional): summary of context used for refinement.

Output (200):
    { "slug", "version", "status", "updated_at" }

Output (400):  missing / invalid parameters.
Output (404):  skill not found for this user.
Output (500):  storage failure.

Related: philkomarny/SkillStore#39
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
)

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_USER_SKILLS_PREFIX = "eduskillsmp/skills/user"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _metadata_key(user_id: str, slug: str) -> str:
    return f"{_USER_SKILLS_PREFIX}/{user_id}/{slug}/metadata.json"


def _content_key(user_id: str, slug: str, version: int) -> str:
    return f"{_USER_SKILLS_PREFIX}/{user_id}/{slug}/v{version}.md"


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
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

    content: str = params.get("content", "")
    if isnullstr(content):
        return _error("Missing required parameter: 'content'", status=400)

    version = params.get("version")
    if not isinstance(version, int) or version < 1:
        return _error("'version' must be a positive integer", status=400)

    status: str = (params.get("status") or "refined").strip()
    context_summary: str = (params.get("context_summary") or "").strip()

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'user_id': user_id, 'version': version, 'status': status, 'context_summary': context_summary})}")

    # Verify the skill exists by reading current metadata.
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_metadata_key(user_id, slug))
        metadata = loads(obj["Body"].read())
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return _error(f"Skill not found: {slug}", status=404)
        raise

    # Write new version content.
    now = datetime.now(tz=timezone.utc).isoformat()
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_content_key(user_id, slug, version),
        Body=content.encode("utf-8"),
        ContentType="text/markdown; charset=utf-8",
    )

    # Update metadata.
    metadata["version"] = version
    metadata["status"] = status
    metadata["updated_at"] = now
    if context_summary:
        metadata["context_summary"] = context_summary
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_metadata_key(user_id, slug),
        Body=dumps(metadata, indent=2),
        ContentType="application/json",
    )

    logger.info(f"Updated skill {slug} to v{version} for user {user_id}")
    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({
            "slug": slug,
            "version": version,
            "status": status,
            "updated_at": now,
        }),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
