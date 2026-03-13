#!/usr/bin/env python
"""Bulk-import multiple skills in a single invocation.

Idempotent: re-running with the same slugs safely overwrites existing objects.
Used by the migration script (scripts/esm/esm-bat-bulk-import-skills.py) to
seed the catalog from the local SkillStore repository, and by enterprise fork
operators bootstrapping a fresh instance.

All three S3 objects per slug (content.md, metadata.json, lineage.json) are
written in parallel via ThreadPoolExecutor.  _index.json is rebuilt once after
all slugs are written.

Curated skills bootstrapped via this endpoint are created with:
  status="approved", verification_level=2, source="curated"
so they appear in the public catalog immediately.

Input (JSON array):
    [
      {
        "slug":     "my-skill",          (str, required)
        "content":  "<raw markdown>",    (str, required)
        "metadata": {                    (dict, required)
          "name":        "My Skill",
          "description": "...",
          "category":    "it-operations",
          "tags":        ["tag1"],
          "source":      "curated",      (optional, default "curated")
          "author_id":   null,           (optional)
          "version":     "1.0.0"         (optional, default "1.0.0")
        }
      },
      ...
    ]

Output (success):
    { "statusCode": 200, "body": { "imported": <int>, "failed": <int>,
                                    "failures": [ { slug, error }, ... ] } }

Output (error):
    { "statusCode": 500, "body": { "message": "<reason>" } }

Related: philkomarny/SkillStore#11 — Operation 4: POST /skills/bulk
"""

from json import dumps, loads
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3

from skillstore_base import (
    configure_logger,
    write_skill_metadata,
    write_skill_content,
    write_skill_lineage,
    rebuild_catalog_index,
)

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")
_MAX_WORKERS: int = 20

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def _import_one(item: dict) -> str:
    """Write content.md, metadata.json, and lineage.json for a single slug.

    Returns the slug on success; raises on failure.
    """
    slug: str = (item.get("slug") or "").strip()
    if not slug:
        raise ValueError("missing slug")

    content: str = item.get("content") or ""
    if not content.strip():
        raise ValueError(f"{slug}: missing content")

    raw_meta: dict = item.get("metadata") or {}
    now = datetime.now(tz=timezone.utc).isoformat()

    metadata = {
        "slug": slug,
        "name": raw_meta.get("name", slug),
        "description": raw_meta.get("description", ""),
        "category": raw_meta.get("category", ""),
        "tags": raw_meta.get("tags", []),
        "version": raw_meta.get("version", "1.0.0"),
        "author_id": raw_meta.get("author_id", None),
        "author_name": raw_meta.get("author_name", None),
        "source": raw_meta.get("source", "curated"),
        "status": "approved",
        "verification_level": 2,
        "created_at": now,
    }

    lineage = {
        "current_status": "approved",
        "verification_level": 2,
        "events": [
            {
                "action": "created",
                "status": "approved",
                "verification_level": 2,
                "at": now,
                "by": "bulk-import",
                "note": None,
            }
        ],
    }

    write_skill_content(s3_client, logger, slug, content, bucket=BUCKET_NAME)
    write_skill_metadata(s3_client, logger, slug, metadata, bucket=BUCKET_NAME)
    write_skill_lineage(s3_client, logger, slug, lineage, bucket=BUCKET_NAME)
    return slug


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Bulk-import skills from a JSON array payload.

    Input: JSON array of { slug, content, metadata } objects.
    Returns:
        200 { imported, failed, failures } on completion (partial success included).
        500 { message } on parse or validation error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    items: list[dict] = []
    body = event.get("body") or event
    if isinstance(body, str):
        try:
            items = loads(body)
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)
    elif isinstance(body, list):
        items = body

    if not items:
        return _error("Request body must be a non-empty JSON array", status=400)

    logger.info(f"Resolved Params: {dumps({'item_count': len(items)})}")
    logger.info(f"Importing {len(items)} skill(s)")

    imported: list[str] = []
    failures: list[dict] = []

    with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as pool:
        futures = {pool.submit(_import_one, item): item for item in items}
        for fut in as_completed(futures):
            item = futures[fut]
            try:
                slug = fut.result()
                imported.append(slug)
                logger.info(f"Imported: {slug}")
            except Exception as exc:
                slug = (item.get("slug") or "unknown").strip()
                logger.warning(f"Failed to import {slug}: {exc}")
                failures.append({"slug": slug, "error": str(exc)})

    # Rebuild index once after all writes complete
    rebuild_catalog_index(s3_client, logger, bucket=BUCKET_NAME)

    logger.info(f"Bulk import complete: {len(imported)} imported, {len(failures)} failed")
    result = {
        "statusCode": 200,
        "headers": _CORS_HEADERS,
        "body": dumps({
            "imported": len(imported),
            "failed": len(failures),
            "failures": failures,
        }),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
