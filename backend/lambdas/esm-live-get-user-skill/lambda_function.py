#!/usr/bin/env python
"""Retrieve a single user-skill's metadata and content from S3.

Reads ``metadata.json`` for the skill's metadata and ``v<n>.md`` for the
current version's markdown content from the user's Refinery prefix
(``eduskillsmp/skills/user/<user_id>/<slug>/``).

Input (GET query params):
    slug     (str, required): kebab-case skill identifier.
    user_id  (str, required): caller's identity (Google OAuth subject ID).

Output (200):
    { "slug", "name", "description", "version", "status",
      "created_at", "updated_at", "content" }

Output (400):  missing / invalid parameters.
Output (404):  skill not found for this user.
Output (500):  storage failure.

Related: philkomarny/SkillStore#33
"""

from json import dumps, loads
import os
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
    "Access-Control-Allow-Methods": "GET,OPTIONS",
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

    params = event.get("queryStringParameters") or event
    slug: str = (params.get("slug") or "").strip()
    if isnullstr(slug):
        return _error("Missing required parameter: 'slug'", status=400)

    user_id: str = (params.get("user_id") or "").strip()
    err = validate_google_sub(user_id)
    if err:
        return _error(err, status=400)

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'user_id': user_id})}")

    # Read metadata.
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_metadata_key(user_id, slug))
        metadata = loads(obj["Body"].read())
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return _error(f"Skill not found: {slug}", status=404)
        raise

    # Read current version content.
    version = metadata.get("version", 1)
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_content_key(user_id, slug, version))
        content = obj["Body"].read().decode("utf-8")
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return _error(f"Content not found for {slug} v{version}", status=404)
        raise

    result = {
        "slug": metadata.get("slug", slug),
        "name": metadata.get("name", slug),
        "description": metadata.get("description", ""),
        "category": metadata.get("category", ""),
        "tags": metadata.get("tags", []),
        "version": version,
        "status": metadata.get("status", "draft"),
        "created_at": metadata.get("created_at", ""),
        "updated_at": metadata.get("updated_at", ""),
        "content": content,
    }

    result_response = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps(result),
    }
    logger.info(f"Return Value: {dumps(result_response)}")
    return result_response
