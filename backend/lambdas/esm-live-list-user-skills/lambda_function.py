#!/usr/bin/env python
"""List all skills in a user's personal Refinery.

Scans ``eduskillsmp/skills/user/<user_id>/`` for metadata.json files and
returns an array of skill metadata, sorted by ``updated_at`` descending
(newest first).

Input (query string or JSON body):
    user_id  (str, required): caller's identity (Google OAuth subject ID).

Output (200):
    {
        "skills": [
            {
                "slug":             "curriculum-designer",
                "base_skill_slug":  "curriculum-designer",
                "name":             "Curriculum Designer",
                "description":      "Design and map course curricula...",
                "category":         "academic-programs",
                "tags":             ["curriculum", "learning-outcomes"],
                "version":          1,
                "status":           "draft",
                "created_at":       "<ISO-8601>",
                "updated_at":       "<ISO-8601>"
            },
            ...
        ]
    }

Output (400):  missing user_id.
Output (500):  storage failure.

Related: philkomarny/SkillStore#30
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr, validate_google_sub

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# S3 layout — https://github.com/philkomarny/SkillStore/issues/36:
#   eduskillsmp/skills/user/<user_id>/<slug>/metadata.json
_USER_SKILLS_PREFIX = "eduskillsmp/skills/user"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _user_prefix(user_id: str) -> str:
    """Return the S3 prefix for all of a user's Refinery skills."""
    return f"{_USER_SKILLS_PREFIX}/{user_id}/"


def _list_user_skills(user_id: str) -> list[dict]:
    """Read all metadata.json files under a user's Refinery prefix."""
    prefix = _user_prefix(user_id)
    paginator = s3_client.get_paginator("list_objects_v2")
    skills = []

    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if not key.endswith("/metadata.json"):
                continue
            try:
                raw = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
                meta = loads(raw["Body"].read())
                skills.append(meta)
            except Exception:
                logger.warning(f"Could not read user-skill metadata: {key}")
                continue

    return skills


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """List all skills in the caller's Refinery.

    Args:
        event: Lambda invocation event.

    Returns:
        200 { skills: [...] } on success.
        400 { message } for missing user_id.
        500 { message } on storage failure.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    qs = event.get("queryStringParameters") or {}
    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception:
            params = {}

    user_id: str = (qs.get("user_id") or params.get("user_id") or "").strip()
    err = validate_google_sub(user_id)
    if err:
        return _error(err, status=400)

    logger.info(f"Resolved Params: {dumps({'user_id': user_id})}")

    skills = _list_user_skills(user_id)

    # Sort by updated_at descending (newest first).
    skills.sort(key=lambda s: s.get("updated_at", ""), reverse=True)

    logger.info(f"Listed {len(skills)} user-skills for user={user_id}")
    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"skills": skills}),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
