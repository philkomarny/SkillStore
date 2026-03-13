#!/usr/bin/env python
"""Stage 3 — Accept/review/reject decision and audit record.

Takes the classification bucket, severity score, and skill metadata
from Stages 1-2 and produces a final screening decision.  Writes an
audit record to S3 for traceability.

Designed for Step Function invocation — accepts and returns native JSON.

Decision matrix:
    helpful-skill (any score)  → accept
    score 1-2                  → accept  (flag for review)
    score 3                    → review  (hold for manual review)
    score >= REJECT_THRESHOLD  → reject

Input (from prior stages):
    slug           (str, required): skill slug.
    bucket         (str, required): classification from screen-classify.
    reasoning      (str, optional): classification reasoning from Stage 1.
    score          (int, required): severity score from screen-score (0 for helpful-skill, 1-5 otherwise).
    justification  (str, optional): scoring justification from Stage 2.
    author_id      (str, optional): submitter's Google OAuth subject ID.

Output:
    { "decision": "accept"|"review"|"reject", "audit_key": "<S3 key>" }

Related: https://github.com/philkomarny/SkillStore/issues/40
"""

from json import dumps
import os
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# Configurable rejection threshold — reject if score >= this value.
_REJECT_THRESHOLD = int(os.getenv("REJECT_THRESHOLD", "4"))

# S3 layout for screening audit records
# https://github.com/philkomarny/SkillStore/issues/40
_SCREENING_PREFIX = "eduskillsmp/skills/screening"

_ALL_BUCKETS = frozenset([
    "helpful-skill",
    "prompt-injection-attack",
    "harmful-instructions",
    "data-exfiltration",
    "impersonation",
    "policy-violation",
])

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


# ---------------------------------------------------------------------------
# S3 helpers
# ---------------------------------------------------------------------------

def _audit_key(slug: str, ts: str) -> str:
    """S3 key for a screening audit record."""
    return f"{_SCREENING_PREFIX}/{slug}/{ts}.json"


def _write_audit(key: str, record: dict) -> None:
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=dumps(record, indent=2).encode("utf-8"),
        ContentType="application/json",
    )


# ---------------------------------------------------------------------------
# Decision logic
# ---------------------------------------------------------------------------

def _decide(bucket: str, score: int) -> str:
    """Return 'accept', 'review', or 'reject' based on bucket and score."""
    if bucket == "helpful-skill":
        return "accept"
    if score >= _REJECT_THRESHOLD:
        return "reject"
    if score >= 3:
        return "review"
    return "accept"


# ---------------------------------------------------------------------------
# Handler
# ---------------------------------------------------------------------------

def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Make a screening decision and write an audit record.

    Step Function stage — receives native JSON, returns native JSON.
    Raises on error (Step Functions catches as a failed state).
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    slug: str = (event.get("slug") or "").strip()
    if isnullstr(slug):
        raise ValueError("Missing required parameter: 'slug'")

    bucket: str = (event.get("bucket") or "").strip().lower()
    if bucket not in _ALL_BUCKETS:
        raise ValueError(f"Invalid bucket: {bucket!r}")

    score_raw = event.get("score")
    if score_raw is None:
        raise ValueError("Missing required parameter: 'score'")
    score = int(score_raw)
    if bucket != "helpful-skill" and (score < 1 or score > 5):
        raise ValueError(f"'score' must be 1-5 for non-helpful buckets, got: {score}")

    reasoning: str = event.get("reasoning", "")
    justification: str = event.get("justification", "")
    author_id: str = event.get("author_id", "")

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'bucket': bucket, 'score': score, 'reasoning': reasoning, 'justification': justification, 'author_id': author_id})}")

    decision = _decide(bucket, score)
    now = datetime.now(tz=timezone.utc)
    ts = now.strftime("%Y%m%dT%H%M%SZ")

    audit_record = {
        "slug": slug,
        "bucket": bucket,
        "reasoning": reasoning,
        "score": score,
        "justification": justification,
        "decision": decision,
        "reject_threshold": _REJECT_THRESHOLD,
        "author_id": author_id,
        "screened_at": now.isoformat(),
    }

    key = _audit_key(slug, ts)
    _write_audit(key, audit_record)

    output = {"decision": decision, "audit_key": key}
    logger.info(f"Return Value: {dumps(output)}")
    return output
