#!/usr/bin/env python
"""Remove a skill from a user's personal Refinery.

Deletes all objects under ``eduskillsmp/skills/user/<user_id>/<slug>/``
(metadata.json and all version files v1.md, v2.md, etc.).

Input (query string or JSON body):
    slug     (str, required): kebab-case skill identifier.
    user_id  (str, required): caller's identity (Google OAuth subject ID).

Output (200):
    { "slug": "<slug>", "removed": true }

Output (400):  missing parameters.
Output (404):  skill not in user's Refinery.
Output (500):  storage failure.

Related: philkomarny/SkillStore#30
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3
from botocore.exceptions import ClientError

from skillstore_base import configure_logger, isnullstr, validate_google_sub

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# S3 layout — https://github.com/philkomarny/SkillStore/issues/36:
#   eduskillsmp/skills/user/<user_id>/<slug>/metadata.json
#   eduskillsmp/skills/user/<user_id>/<slug>/v1.md
#   eduskillsmp/skills/user/<user_id>/<slug>/v2.md  (after refinement)
_USER_SKILLS_PREFIX = "eduskillsmp/skills/user"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "DELETE,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _skill_prefix(user_id: str, slug: str) -> str:
    """Return the S3 prefix for a specific user-skill directory."""
    return f"{_USER_SKILLS_PREFIX}/{user_id}/{slug}/"


def _metadata_key(user_id: str, slug: str) -> str:
    """Return the S3 key for a user-skill's metadata JSON."""
    return f"{_USER_SKILLS_PREFIX}/{user_id}/{slug}/metadata.json"


def _skill_exists(user_id: str, slug: str) -> bool:
    """Return True if the user has this skill in their Refinery."""
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=_metadata_key(user_id, slug))
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "404":
            return False
        raise


def _delete_all(user_id: str, slug: str) -> int:
    """Delete all objects under the user-skill prefix. Returns count deleted."""
    prefix = _skill_prefix(user_id, slug)
    paginator = s3_client.get_paginator("list_objects_v2")
    keys: list[str] = []

    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix):
        for obj in page.get("Contents", []):
            keys.append(obj["Key"])

    if not keys:
        return 0

    # S3 DeleteObjects accepts up to 1000 keys per call.
    for i in range(0, len(keys), 1000):
        batch = keys[i:i + 1000]
        s3_client.delete_objects(
            Bucket=BUCKET_NAME,
            Delete={"Objects": [{"Key": k} for k in batch]},
        )

    return len(keys)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Remove a skill from the caller's Refinery.

    Args:
        event: Lambda invocation event with query string or JSON body fields.

    Returns:
        200 { slug, removed } on success.
        400 { message } for missing parameters.
        404 { message } when skill not in Refinery.
        500 { message } on storage failure.
    """
    logger.info(f"Incoming Event (keys): {list(event.keys())}")

    qs = event.get("queryStringParameters") or {}
    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)

    slug: str = (qs.get("slug") or params.get("slug") or "").strip()
    if isnullstr(slug):
        return _error("Missing required parameter: 'slug'", status=400)

    user_id: str = (qs.get("user_id") or params.get("user_id") or "").strip()
    err = validate_google_sub(user_id)
    if err:
        return _error(err, status=400)

    if not _skill_exists(user_id, slug):
        return _error(f"Skill {slug} not found in Refinery for user {user_id}", status=404)

    count = _delete_all(user_id, slug)

    logger.info(f"Deleted user-skill: slug={slug} user={user_id} objects={count}")
    return {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"slug": slug, "removed": True}),
    }
