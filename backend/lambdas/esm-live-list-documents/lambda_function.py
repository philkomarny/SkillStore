#!/usr/bin/env python
"""List the documents in a user's personal library.

Returns lightweight references (md5, filename, added_at) from the user's
library.  Status is resolved by joining against the global store metadata
so callers know whether text extraction is complete.

Input (query string or JSON body):
    user_id  (str, required): caller's identity (Google OAuth subject ID).

Output (200):
    {
        "documents": [
            {
                "md5":      "<hash>",
                "filename": "lecture-notes.pdf",
                "added_at": "<ISO-8601>",
                "status":   "processing" | "ready" | "error"
            },
            ...
        ]
    }

Output (400):  missing user_id.
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
#   user-store — user library: eduskillsmp/documents/user-store/<user_id>/<md5>.json
_STORE_PREFIX = "eduskillsmp/documents/store"
_USER_STORE_PREFIX = "eduskillsmp/documents/user-store"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _metadata_key(md5: str) -> str:
    """Return the S3 key for a document's metadata JSON in the global store."""
    return f"{_STORE_PREFIX}/{md5[:2]}/{md5}.json"


def _library_prefix(user_id: str) -> str:
    """Return the S3 prefix for listing all of a user's library references."""
    return f"{_USER_STORE_PREFIX}/{user_id}/"


def _read_status(md5: str) -> str:
    """Look up current status from the global store metadata."""
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_metadata_key(md5))
        meta = loads(obj["Body"].read())
        return meta.get("status", "processing")
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return "error"
        raise


def _list_library(user_id: str) -> list[dict]:
    """Return all library references for user_id."""
    prefix = _library_prefix(user_id)
    paginator = s3_client.get_paginator("list_objects_v2")
    refs = []

    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix):
        for obj in page.get("Contents", []):
            try:
                raw = s3_client.get_object(Bucket=BUCKET_NAME, Key=obj["Key"])
                ref = loads(raw["Body"].read())
                refs.append(ref)
            except Exception:
                logger.warning(f"Could not read library ref: {obj['Key']}")
                continue

    return refs


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """List all documents in the caller's library.

    Args:
        event: Lambda invocation event.

    Returns:
        200 { documents: [...] } on success.
        400 { message } for missing user_id.
        500 { message } on storage failure.
    """
    logger.info(f"Incoming Event (keys): {list(event.keys())}")

    # Support both query string and JSON body.
    qs = event.get("queryStringParameters") or {}
    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception:
            params = {}

    user_id: str = (qs.get("user_id") or params.get("user_id") or "").strip()
    if isnullstr(user_id):
        return _error("Missing required parameter: 'user_id'", status=400)

    refs = _list_library(user_id)

    # Enrich each ref with current status from the global store.
    documents = []
    for ref in refs:
        md5 = ref.get("md5", "")
        documents.append({
            "md5": md5,
            "filename": ref.get("filename", ""),
            "added_at": ref.get("added_at", ""),
            "status": _read_status(md5) if md5 else "error",
        })

    # Sort by added_at descending (newest first).
    documents.sort(key=lambda d: d.get("added_at", ""), reverse=True)

    logger.info(f"Listed {len(documents)} documents for user={user_id}")
    return {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"documents": documents}),
    }
