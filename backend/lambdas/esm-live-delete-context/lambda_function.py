#!/usr/bin/env python
"""Delete a context.

Removes the context's S3 objects (metadata.json and output.json).
The source documents are not affected.

Input:
    contextId  (str, required): context identifier (e.g. ``ctx_abc12345``).
    user_id    (str, required): owner of the context (Google OAuth subject ID).

Output (204):  no body — context deleted.
Output (400):  missing contextId or user_id.
Output (404):  context not found.
Output (500):  storage failure.

Related: https://github.com/philkomarny/SkillStore/issues/18
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3
from botocore.exceptions import ClientError

from skillstore_base import configure_logger, isnullstr, validate_google_sub

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_CONTEXTS_PREFIX = "eduskillsmp/contexts"  # https://github.com/philkomarny/SkillStore/issues/26

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "DELETE,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


# ---------------------------------------------------------------------------
# S3 helpers
# ---------------------------------------------------------------------------

def _context_metadata_key(user_id: str, context_id: str) -> str:
    # https://github.com/philkomarny/SkillStore/issues/26
    return f"{_CONTEXTS_PREFIX}/{user_id}/{context_id}/metadata.json"


def _context_output_key(user_id: str, context_id: str) -> str:
    # https://github.com/philkomarny/SkillStore/issues/26
    return f"{_CONTEXTS_PREFIX}/{user_id}/{context_id}/output.json"


def _s3_exists(key: str) -> bool:
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=key)
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "404":
            return False
        raise


def _s3_delete(key: str) -> None:
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
    except ClientError as exc:
        if exc.response["Error"]["Code"] not in ("404", "NoSuchKey"):
            raise


# ---------------------------------------------------------------------------
# Error helper
# ---------------------------------------------------------------------------

def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


# ---------------------------------------------------------------------------
# Handler
# ---------------------------------------------------------------------------

def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Delete a context and its S3 objects.

    Input fields:
        contextId  (str, required): accepted as query string or JSON body field.
        user_id    (str, required): accepted as query string or JSON body field.

    Returns:
        204 (no body) on success.
        400 { message } for missing contextId or user_id.
        404 { message } if context not found.
        500 { message } on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    qs = event.get("queryStringParameters") or {}
    body_params: dict = {}
    if isinstance(event.get("body"), str):
        try:
            body_params = loads(event["body"])
        except Exception:
            pass

    context_id: str = (qs.get("contextId") or body_params.get("contextId") or "").strip()
    if isnullstr(context_id):
        return _error("Missing required parameter: 'contextId'", status=400)

    user_id: str = (qs.get("user_id") or body_params.get("user_id") or "").strip()  # https://github.com/philkomarny/SkillStore/issues/26
    err = validate_google_sub(user_id)  # https://github.com/philkomarny/SkillStore/issues/27
    if err:
        return _error(err, status=400)

    if not _s3_exists(_context_metadata_key(user_id, context_id)):
        return _error(f"Context not found: {context_id}", status=404)

    _s3_delete(_context_metadata_key(user_id, context_id))
    _s3_delete(_context_output_key(user_id, context_id))

    logger.info(f"Context deleted: {context_id} user={user_id}")
    return {
        "statusCode": 204,
        "headers": _CORS_HEADERS,
        "body": "",
    }
