#!/usr/bin/env python
# -*- coding: UTF-8 -*-

"""S3-backed skill catalog store for the eduskillsmp skill content API.

Manages three files per skill slug under a shared S3 prefix:
  - content.md      raw SKILL.md with YAML frontmatter
  - metadata.json   identity fields set on creation
  - lineage.json    append-only audit log of every modification

Shared catalog files:
  - _index.json                      pre-built published skill list; rebuilt on every write
  - _exports/<YYYYMMDD>-<uuid>.json  point-in-time snapshots

S3 layout
---------
  s3://mskillsiq/eduskillsmp/skill-catalog/
    <slug>/content.md
    <slug>/metadata.json
    <slug>/lineage.json
    _index.json
    _exports/<YYYYMMDD>-<uuid>.json

Related GitHub Issues
---------------------
  philkomarny/SkillStore#11
"""

from __future__ import annotations

import json
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from logging import Logger

from botocore.exceptions import ClientError

_CATALOG_BUCKET = "mskillsiq"
_CATALOG_PREFIX = "eduskillsmp/skill-catalog"


# ---------------------------------------------------------------------------
# S3 key helpers
# ---------------------------------------------------------------------------


def catalog_meta_key(slug: str) -> str:
    return f"{_CATALOG_PREFIX}/{slug}/metadata.json"


def catalog_content_key(slug: str) -> str:
    return f"{_CATALOG_PREFIX}/{slug}/content.md"


def catalog_lineage_key(slug: str) -> str:
    return f"{_CATALOG_PREFIX}/{slug}/lineage.json"


def catalog_index_key() -> str:
    return f"{_CATALOG_PREFIX}/_index.json"


def catalog_export_key() -> str:
    dt = datetime.now(tz=timezone.utc).strftime("%Y%m%d")
    return f"{_CATALOG_PREFIX}/_exports/{dt}-{uuid.uuid4()}.json"


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Internal S3 helpers
# ---------------------------------------------------------------------------


def _get_json(s3_client, bucket: str, key: str) -> dict | list | None:
    try:
        obj = s3_client.get_object(Bucket=bucket, Key=key)
        return json.loads(obj["Body"].read().decode("utf-8"))
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def _get_text(s3_client, bucket: str, key: str) -> str | None:
    try:
        obj = s3_client.get_object(Bucket=bucket, Key=key)
        return obj["Body"].read().decode("utf-8")
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def _put_json(s3_client, bucket: str, key: str, data: dict | list) -> None:
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(data),
        ContentType="application/json",
    )


def _put_text(s3_client, bucket: str, key: str, data: str) -> None:
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data.encode("utf-8"),
        ContentType="text/markdown; charset=utf-8",
    )


# ---------------------------------------------------------------------------
# Public API — single-skill operations
# ---------------------------------------------------------------------------


def skill_exists(
    s3_client,
    logger: Logger,
    slug: str,
    bucket: str = _CATALOG_BUCKET,
) -> bool:
    """Return True if metadata.json exists for *slug*, False otherwise."""
    key = catalog_meta_key(slug)
    try:
        s3_client.head_object(Bucket=bucket, Key=key)
        logger.info(f"skill_exists: found {slug}")
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
            logger.info(f"skill_exists: not found {slug}")
            return False
        raise


def read_skill_metadata(
    s3_client,
    logger: Logger,
    slug: str,
    bucket: str = _CATALOG_BUCKET,
) -> dict | None:
    """Return metadata.json for *slug*, or None if the slug does not exist."""
    data = _get_json(s3_client, bucket, catalog_meta_key(slug))
    if data is None:
        logger.info(f"read_skill_metadata: not found {slug}")
    return data


def read_skill_content(
    s3_client,
    logger: Logger,
    slug: str,
    bucket: str = _CATALOG_BUCKET,
) -> str | None:
    """Return raw content.md text for *slug*, or None if absent."""
    data = _get_text(s3_client, bucket, catalog_content_key(slug))
    if data is None:
        logger.info(f"read_skill_content: not found {slug}")
    return data


def read_skill_lineage(
    s3_client,
    logger: Logger,
    slug: str,
    bucket: str = _CATALOG_BUCKET,
) -> dict | None:
    """Return lineage.json for *slug*, or None if absent."""
    data = _get_json(s3_client, bucket, catalog_lineage_key(slug))
    if data is None:
        logger.info(f"read_skill_lineage: not found {slug}")
    return data


def write_skill_metadata(
    s3_client,
    logger: Logger,
    slug: str,
    metadata: dict,
    bucket: str = _CATALOG_BUCKET,
) -> None:
    """Write metadata.json for *slug*."""
    key = catalog_meta_key(slug)
    _put_json(s3_client, bucket, key, metadata)
    logger.info(f"write_skill_metadata: wrote {key}")


def write_skill_content(
    s3_client,
    logger: Logger,
    slug: str,
    content: str,
    bucket: str = _CATALOG_BUCKET,
) -> None:
    """Write content.md for *slug*."""
    key = catalog_content_key(slug)
    _put_text(s3_client, bucket, key, content)
    logger.info(f"write_skill_content: wrote {key}")


def write_skill_lineage(
    s3_client,
    logger: Logger,
    slug: str,
    lineage: dict,
    bucket: str = _CATALOG_BUCKET,
) -> None:
    """Write (overwrite) lineage.json for *slug*."""
    key = catalog_lineage_key(slug)
    _put_json(s3_client, bucket, key, lineage)
    logger.info(f"write_skill_lineage: wrote {key}")


def append_lineage_event(
    s3_client,
    logger: Logger,
    slug: str,
    action: str,
    status: str,
    verification_level: int,
    by: str,
    note: str | None = None,
    bucket: str = _CATALOG_BUCKET,
) -> None:
    """Append an event to lineage.json for *slug*, updating denormalized fields.

    Reads the existing lineage (or initializes if absent), appends the event,
    updates current_status and verification_level, then writes back.

    action vocabulary:
        created, content_updated, metadata_updated, review_started,
        bot_verified, approved, rejected, deprecated, restored
    """
    existing = read_skill_lineage(s3_client, logger, slug, bucket=bucket) or {
        "current_status": status,
        "verification_level": verification_level,
        "events": [],
    }
    event = {
        "action": action,
        "status": status,
        "verification_level": verification_level,
        "at": _now_iso(),
        "by": by,
        "note": note,
    }
    existing["events"].append(event)
    existing["current_status"] = status
    existing["verification_level"] = verification_level
    write_skill_lineage(s3_client, logger, slug, existing, bucket=bucket)
    logger.info(f"append_lineage_event: {slug} action={action} status={status}")


# ---------------------------------------------------------------------------
# Public API — catalog index
# ---------------------------------------------------------------------------


def rebuild_catalog_index(
    s3_client,
    logger: Logger,
    bucket: str = _CATALOG_BUCKET,
    include_all_statuses: bool = False,
) -> int:
    """Scan all skill metadata and rebuild _index.json.

    Uses S3 list with Delimiter="/" to enumerate slug prefixes without
    listing individual files.  Reads all metadata in parallel via
    ThreadPoolExecutor(max_workers=20).

    Args:
        include_all_statuses: if True, include skills of any status (admin
            view).  If False, only skills with status "approved" are included.

    Returns:
        Number of skills written to the index.
    """
    prefix = f"{_CATALOG_PREFIX}/"
    paginator = s3_client.get_paginator("list_objects_v2")

    meta_keys: list[str] = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix, Delimiter="/"):
        for cp in page.get("CommonPrefixes", []):
            slug = cp["Prefix"].rstrip("/").split("/")[-1]
            if slug.startswith("_"):
                continue
            meta_keys.append(f"{cp['Prefix']}metadata.json")

    logger.info(f"rebuild_catalog_index: found {len(meta_keys)} slug(s)")

    def _load(key: str) -> dict | None:
        return _get_json(s3_client, bucket, key)

    entries: list[dict] = []
    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(_load, k): k for k in meta_keys}
        for fut in as_completed(futures):
            key = futures[fut]
            try:
                meta = fut.result()
            except Exception as exc:
                logger.warning(f"rebuild_catalog_index: failed to read {key}: {exc}")
                continue
            if meta is None:
                continue
            status = meta.get("status", "approved")
            if not include_all_statuses and status != "approved":
                continue
            slug = meta.get("slug", key.split("/")[-2])
            entries.append({
                "slug": slug,
                "name": meta.get("name", ""),
                "description": meta.get("description", ""),
                "category": meta.get("category", ""),
                "tags": meta.get("tags", []),
                "version": meta.get("version", "1.0.0"),
                "verificationLevel": meta.get("verification_level", 0),
                "status": status,
            })

    entries.sort(key=lambda x: x["slug"])
    _put_json(s3_client, bucket, catalog_index_key(), entries)
    logger.info(f"rebuild_catalog_index: wrote {len(entries)} entries to {catalog_index_key()}")
    return len(entries)


def read_catalog_index(
    s3_client,
    logger: Logger,
    bucket: str = _CATALOG_BUCKET,
) -> list[dict]:
    """Return the current _index.json, or an empty list if absent."""
    data = _get_json(s3_client, bucket, catalog_index_key())
    if data is None:
        logger.info("read_catalog_index: _index.json not found, returning empty list")
        return []
    return data


def export_catalog(
    s3_client,
    logger: Logger,
    bucket: str = _CATALOG_BUCKET,
) -> str:
    """Snapshot the full catalog (metadata + content + lineage) to _exports/.

    Reads all slugs in parallel and writes a single JSON array to:
        eduskillsmp/skill-catalog/_exports/<YYYYMMDD>-<uuid>.json

    Returns:
        The S3 key of the written snapshot.
    """
    prefix = f"{_CATALOG_PREFIX}/"
    paginator = s3_client.get_paginator("list_objects_v2")

    slug_list: list[str] = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix, Delimiter="/"):
        for cp in page.get("CommonPrefixes", []):
            slug = cp["Prefix"].rstrip("/").split("/")[-1]
            if not slug.startswith("_"):
                slug_list.append(slug)

    logger.info(f"export_catalog: exporting {len(slug_list)} slug(s)")

    def _load_skill(slug: str) -> dict:
        return {
            "slug": slug,
            "metadata": _get_json(s3_client, bucket, catalog_meta_key(slug)) or {},
            "content": _get_text(s3_client, bucket, catalog_content_key(slug)) or "",
            "lineage": _get_json(s3_client, bucket, catalog_lineage_key(slug)) or {},
        }

    skills: list[dict] = []
    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(_load_skill, s): s for s in slug_list}
        for fut in as_completed(futures):
            slug = futures[fut]
            try:
                skills.append(fut.result())
            except Exception as exc:
                logger.warning(f"export_catalog: failed to load {slug}: {exc}")

    skills.sort(key=lambda x: x["slug"])
    export_key = catalog_export_key()
    _put_json(s3_client, bucket, export_key, skills)
    logger.info(f"export_catalog: wrote {len(skills)} skills to {export_key}")
    return export_key
