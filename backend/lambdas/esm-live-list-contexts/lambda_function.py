#!/usr/bin/env python
"""List all contexts owned by a user.

Scans the user's S3 prefix and returns one entry per context by reading each
context's metadata.json.  No global index file is used.

Input (query string parameters):
    user_id  (str, required): owner whose contexts to list (Google OAuth subject ID).

Output (200):
    [
        {
            "contextId": "ctx_...",
            "name": "...",
            "status": "...",
            "createdAt": "...",
            "createdBy": "..."
        },
        ...
    ]

Output (400): missing user_id.
Output (500): storage failure.

Related: https://github.com/philkomarny/SkillStore/issues/18
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3
from botocore.exceptions import ClientError

from skillstore_base import configure_logger, validate_google_sub

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_CONTEXTS_PREFIX = "eduskillsmp/contexts"  # https://github.com/febelabs/skillflow/issues/139

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _list_contexts_for_user(user_id: str) -> list[dict]:
    """List all contexts for a user by scanning their S3 prefix.

    https://github.com/febelabs/skillflow/issues/139
    """
    prefix = f"{_CONTEXTS_PREFIX}/{user_id}/"
    paginator = s3_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix, Delimiter="/")

    context_ids: list[str] = []
    for page in pages:
        for cp in page.get("CommonPrefixes") or []:
            # cp["Prefix"] = "eduskillsmp/contexts/<user_id>/<context_id>/"
            parts = cp["Prefix"].rstrip("/").split("/")
            context_ids.append(parts[-1])

    entries: list[dict] = []
    for context_id in context_ids:
        key = f"{prefix}{context_id}/metadata.json"
        try:
            obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
            meta = loads(obj["Body"].read())
            entries.append({
                "contextId": meta.get("contextId", context_id),
                "name": meta.get("name", ""),
                "status": meta.get("status", ""),
                "createdAt": meta.get("createdAt", ""),
                "createdBy": meta.get("createdBy", user_id),
            })
        except ClientError as exc:
            if exc.response["Error"]["Code"] not in ("404", "NoSuchKey"):
                raise

    return entries


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Return all contexts owned by the given user.

    Input:
        user_id  (str, required query param): owner's Google OAuth subject ID.

    Returns:
        200 with JSON array of { contextId, name, status, createdAt, createdBy }.
        400 { message } for missing user_id.
        500 { message } on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    qs = event.get("queryStringParameters") or {}
    user_id: str = (qs.get("user_id") or "").strip()  # https://github.com/febelabs/skillflow/issues/139
    err = validate_google_sub(user_id)  # https://github.com/febelabs/skillflow/issues/140
    if err:
        return _error(err, status=400)

    entries = _list_contexts_for_user(user_id)

    logger.info(f"Returning {len(entries)} context(s) for user_id={user_id!r}")
    return {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps(entries),
    }
