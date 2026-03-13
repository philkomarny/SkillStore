#!/usr/bin/env python
"""Export a full point-in-time snapshot of the skill catalog to S3.

Reads all skill slugs in parallel (metadata + content + lineage) and writes
a single JSON array to:
    s3://mskillsiq/eduskillsmp/skills/catalog/_exports/<YYYYMMDD>-<uuid>.json

Used for backups and for enterprise fork operators seeding a fresh instance.
The export key is returned in the response so callers can download directly
from S3 or pass it to a migration script.

Input: none required.

Output (success):
    { "statusCode": 200, "body": { "export_key": "<s3-key>",
                                    "skill_count": <int> } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operation 9: GET /skills/export
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, export_catalog

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Snapshot the full catalog to S3 _exports/ and return the key.

    Returns:
        200 { export_key, skill_count } on success.
        500 { message } on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    logger.info(f"Resolved Params: {dumps({})}")

    export_key = export_catalog(s3_client, logger, bucket=BUCKET_NAME)

    # Derive skill count from the key name isn't reliable; read it back.
    # export_catalog already logged the count — re-derive from the response.
    # We avoid an extra S3 read by parsing the count from the log; instead
    # we do one lightweight read to report it accurately.
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=export_key)
        skills = loads(obj["Body"].read().decode("utf-8"))
        skill_count = len(skills)
    except Exception:
        skill_count = -1

    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({"export_key": export_key, "skill_count": skill_count}),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
