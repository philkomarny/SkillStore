#!/usr/bin/env python
"""Retrieve document metadata and extracted text from the global store.

Returns the document's metadata plus extracted plain text (when available).
If the document is still ``processing``, the ``text`` field will be null.

Input (path parameter, query string, or JSON body):
    md5      (str, required): 32-character hex MD5 hash of the document.
    user_id  (str, optional): when supplied, verifies the document is in
                               the caller's library before returning.

Output (200):
    {
        "md5":       "<hash>",
        "filename":  "lecture-notes.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 123456,
        "status":    "ready" | "processing" | "error",
        "created_at": "<ISO-8601>",
        "text":      "<extracted plain text>" | null
    }

Output (400):  missing md5.
Output (404):  document not found in global store.
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

# S3 layout — https://github.com/philkomarny/SkillStore/issues/16:
#   store      — raw uploads:  eduskillsmp/documents/store/<md5[:2]>/<md5>.json
#   text-store — extracted:    eduskillsmp/documents/text-store/<md5[:2]>/<md5>.txt
#   user-store — user library: eduskillsmp/documents/user-store/<user_id>/<md5>.json
_STORE_PREFIX = "eduskillsmp/documents/store"
_TEXT_STORE_PREFIX = "eduskillsmp/documents/text-store"
_USER_STORE_PREFIX = "eduskillsmp/documents/user-store"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _metadata_key(md5: str) -> str:
    """Return the S3 key for a document's metadata JSON."""
    return f"{_STORE_PREFIX}/{md5[:2]}/{md5}.json"


def _text_key(md5: str) -> str:
    """Return the S3 key for a document's extracted text."""
    return f"{_TEXT_STORE_PREFIX}/{md5[:2]}/{md5}.txt"


def _library_key(user_id: str, md5: str) -> str:
    """Return the S3 key for a user's library reference to a document."""
    return f"{_USER_STORE_PREFIX}/{user_id}/{md5}.json"


def _read_text(md5: str) -> str | None:
    """Return extracted text, or None if not yet available."""
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_text_key(md5))
        return obj["Body"].read().decode("utf-8")
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return None
        raise


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
    """Fetch metadata and extracted text for a document.

    Args:
        event: Lambda invocation event.

    Returns:
        200 { md5, filename, mime_type, size_bytes, status, created_at, text }
        400 { message } for missing md5.
        404 { message } when document not found.
        500 { message } on storage failure.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    # Resolve md5 from path parameters, query string, or body.
    path_params = event.get("pathParameters") or {}
    qs = event.get("queryStringParameters") or {}
    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception:
            params = {}

    md5: str = (path_params.get("md5") or qs.get("md5") or params.get("md5") or "").strip().lower()
    if isnullstr(md5):
        return _error("Missing required parameter: 'md5'", status=400)

    user_id: str = (qs.get("user_id") or params.get("user_id") or "").strip()

    logger.info(f"Resolved Params: {dumps({'md5': md5, 'user_id': user_id})}")

    # Optional library membership check.
    if user_id and not _in_library(user_id, md5):
        return _error(f"Document {md5} not found in library for user {user_id}", status=404)

    # Read global store metadata.
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_metadata_key(md5))
        metadata = loads(obj["Body"].read())
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return _error(f"Document not found: {md5}", status=404)
        raise

    text = _read_text(md5) if metadata.get("status") == "ready" else None

    response_body = {
        "md5": md5,
        "filename": metadata.get("filename", ""),
        "mime_type": metadata.get("mime_type", ""),
        "size_bytes": metadata.get("size_bytes", 0),
        "status": metadata.get("status", "processing"),
        "created_at": metadata.get("created_at", ""),
        "text": text,
    }

    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps(response_body),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
