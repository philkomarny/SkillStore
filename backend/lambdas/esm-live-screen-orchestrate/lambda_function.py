#!/usr/bin/env python
"""Orchestrator for the esm-live-screen-skills Step Function (#46).

Thin wrapper that validates input and calls StartSyncExecution on the
Express Step Function.  Returns the screening decision to the caller.

Input:
    content    (str, required): full refined skill markdown.
    slug       (str, required): skill slug.
    author_id  (str, optional): submitter's Google OAuth subject ID.

Output:
    { "decision": "accept"|"review"|"reject", "audit_key": "<S3 key>" }

Related: https://github.com/philkomarny/SkillStore/issues/40
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr

_STATE_MACHINE_ARN = os.environ["SCREENING_STATE_MACHINE_ARN"]

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

_sfn_client = boto3.client("stepfunctions", region_name="us-west-2")
logger: Logger = configure_logger(__name__)


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
    """Start a synchronous esm-live-screen-skills execution.

    This Lambda is called via API Gateway, so it uses HTTP-style
    request/response format (statusCode + body).  The inner pipeline
    Lambdas use native JSON for Step Function compatibility.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)

    content: str = (params.get("content") or "").strip()
    if isnullstr(content):
        return _error("Missing required parameter: 'content'", status=400)

    slug: str = (params.get("slug") or "").strip()
    if isnullstr(slug):
        return _error("Missing required parameter: 'slug'", status=400)

    author_id: str = params.get("author_id", "")

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'author_id': author_id, 'content_length': len(content)})}")

    sfn_input = {
        "content": content,
        "slug": slug,
        "author_id": author_id,
    }

    logger.info(f"Starting esm-live-screen-skills: slug={slug} chars={len(content)}")

    try:
        response = _sfn_client.start_sync_execution(
            stateMachineArn=_STATE_MACHINE_ARN,
            input=dumps(sfn_input),
        )
    except Exception as exc:
        return _error(f"Step Function execution failed to start: {exc}")

    status = response.get("status")
    if status != "SUCCEEDED":
        error_detail = response.get("error", "unknown")
        cause = response.get("cause", "")
        return _error(f"esm-live-screen-skills {status}: {error_detail} — {cause}")

    sfn_result = loads(response["output"])

    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps(sfn_result),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
