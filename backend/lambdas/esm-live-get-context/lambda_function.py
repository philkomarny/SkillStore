#!/usr/bin/env python
"""Retrieve a context by ID — status poll and full result fetch.

Returns the context metadata and, when status is ``ready``, the synthesised
markdown.

Input (query string or JSON body):
    contextId  (str, required): context identifier (e.g. ``ctx_abc12345``).
    user_id    (str, required): owner of the context (Google OAuth subject ID).

Output (200, building):
    { "contextId": "ctx_...", "name": "...", "status": "building" }

Output (200, ready):
    {
        "contextId": "ctx_...",
        "name": "...",
        "status": "ready",
        "markdown": "## ...",
        "documents": [ { "md5": "...", "fileName": "...", "fileType": "..." } ],
        "createdAt": "<ISO-8601>"
    }

Output (400): missing contextId or user_id.
Output (404): context not found.
Output (500): storage failure.

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
    "Access-Control-Allow-Methods": "GET,OPTIONS",
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


def _s3_read_json(key: str) -> dict | list | None:
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
        return loads(obj["Body"].read())
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return None
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
    """Return context metadata and markdown (when ready).

    Input:
        contextId  (str, required): accepted as query string or JSON body field.
        user_id    (str, required): accepted as query string or JSON body field.

    Returns:
        200 { contextId, name, status } when building.
        200 { contextId, name, status, markdown, documents, createdAt } when ready.
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

    logger.info(f"Resolved Params: {dumps({'context_id': context_id, 'user_id': user_id})}")

    metadata = _s3_read_json(_context_metadata_key(user_id, context_id))
    if metadata is None:
        return _error(f"Context not found: {context_id}", status=404)

    status = metadata.get("status", "building")
    response: dict[str, Any] = {
        "contextId": context_id,
        "name": metadata.get("name", ""),
        "status": status,
    }

    if status == "ready":
        output = _s3_read_json(_context_output_key(user_id, context_id)) or {}
        response["markdown"] = output.get("markdown", "")
        response["documents"] = metadata.get("documents", [])
        response["createdAt"] = metadata.get("createdAt", "")

    logger.info(f"Returning context {context_id} status={status}")
    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps(response),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
