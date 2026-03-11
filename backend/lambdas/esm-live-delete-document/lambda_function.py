#!/usr/bin/env python
"""Remove a document from a user's personal library.

Deletes the caller's library reference only.  The global content-addressable
store record is never removed — other users may hold references to the same
document, and re-uploading the same file should remain free (idempotent).

Input (JSON body):
    md5      (str, required): 32-character hex MD5 hash.
    user_id  (str, required): caller's identity (Google OAuth subject ID).

Output (200):
    { "md5": "<hash>", "removed": true }

Output (400):  missing parameters.
Output (404):  document not in caller's library.
Output (500):  storage failure.

Related: philkomarny/SkillStore#14
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3
from botocore.exceptions import ClientError

from skillstore_base import configure_logger, isnullstr

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# S3 layout — see esm-live-upload-document for full structure diagram.
# This Lambda only touches the user library; the global store is never modified.
#   User library:  eduskillsmp/documents/library/<user_id>/<md5>.json
_LIBRARY_PREFIX = "eduskillsmp/documents/library"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "DELETE,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _library_key(user_id: str, md5: str) -> str:
    """Return the S3 key for a user's library reference to a document."""
    return f"{_LIBRARY_PREFIX}/{user_id}/{md5}.json"


def _in_library(user_id: str, md5: str) -> bool:
    """Return True if the user's library contains a reference to this document."""
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=_library_key(user_id, md5))
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "404":
            return False
        raise


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Remove a document from the caller's library.

    Args:
        event: Lambda invocation event with JSON body fields.

    Returns:
        200 { md5, removed } on success.
        400 { message } for missing parameters.
        404 { message } when document not in library.
        500 { message } on storage failure.
    """
    logger.info(f"Incoming Event (keys): {list(event.keys())}")

    # Support query string params (DELETE) and JSON body (POST).
    qs = event.get("queryStringParameters") or {}
    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)

    md5: str = (qs.get("md5") or params.get("md5") or "").strip().lower()
    if isnullstr(md5):
        return _error("Missing required parameter: 'md5'", status=400)

    user_id: str = (qs.get("user_id") or params.get("user_id") or "").strip()
    if isnullstr(user_id):
        return _error("Missing required parameter: 'user_id'", status=400)

    if not _in_library(user_id, md5):
        return _error(f"Document {md5} not found in library for user {user_id}", status=404)

    s3_client.delete_object(Bucket=BUCKET_NAME, Key=_library_key(user_id, md5))

    logger.info(f"Removed library ref: md5={md5} user={user_id}")
    return {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"md5": md5, "removed": True}),
    }
