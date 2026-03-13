#!/usr/bin/env python
"""Stage 2 — Quantitative risk scoring of a non-safe skill classification.

Takes skill content and the bucket from Stage 1 and produces a severity
score from 1 (minimal) to 5 (critical).

Designed for Step Function invocation — accepts and returns native JSON.
Passes through all input fields and enriches with {score, justification}.

Input:
    content    (str, required): full skill markdown (frontmatter + body).
    bucket     (str, required): classification bucket from screen-classify.
    slug       (str, optional): skill slug for logging/audit.
    author_id  (str, optional): passed through for downstream stages.
    reasoning  (str, optional): passed through from Stage 1.

Output:
    { ...input fields, "score": <1-5>, "justification": "<explanation>" }

Related: https://github.com/philkomarny/SkillStore/issues/40
"""

from json import dumps, loads
import os
from logging import Logger
from typing import Any

import boto3

from skillstore_base import configure_logger, isnullstr

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# Claude Haiku 4.5 via Bedrock cross-region inference
_MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"

_VALID_BUCKETS = frozenset([
    "prompt-injection-attack",
    "harmful-instructions",
    "data-exfiltration",
    "impersonation",
    "policy-violation",
])

_SYSTEM_INSTRUCTION = """\
You are a safety risk scorer for an enterprise skill marketplace.

A skill has already been classified into one of these non-safe buckets:
  prompt-injection-attack, harmful-instructions, data-exfiltration,
  impersonation, policy-violation.

Your job is to assign a severity score from 1 to 5:

  1 — Minimal: Borderline or ambiguous. Could be a false positive. \
Low confidence that this is actually harmful.
  2 — Low: Minor concern. Mildly inappropriate phrasing or structure \
but unlikely to cause real harm.
  3 — Medium: Moderate concern. Clear intent to do something outside \
normal skill behavior, but limited potential impact.
  4 — High: Serious concern. Clear malicious intent or significant \
potential for harm if executed.
  5 — Critical: Unambiguous attack or dangerous content. Immediate \
threat if deployed.

Consider:
- How explicit is the harmful intent?
- How much damage could it cause if the skill were installed and used?
- Could this be an honest mistake vs. deliberate abuse?
- Is this targeting the AI system itself or end users?

Respond with ONLY valid JSON — no markdown fences, no extra text:
{"score": <integer 1-5>, "justification": "<2-3 sentence explanation>"}\
"""

_bedrock_client = boto3.client("bedrock-runtime", region_name="us-west-2")
logger: Logger = configure_logger(__name__)


# ---------------------------------------------------------------------------
# LLM scoring
# ---------------------------------------------------------------------------

def _score(content: str, bucket: str) -> dict:
    """Send skill content + bucket to Claude and return {score, justification}."""
    user_prompt = (
        f"This skill was classified as: {bucket}\n\n"
        f"Skill content:\n\n{content}"
    )

    config = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 256,
        "temperature": 0.0,
        "system": _SYSTEM_INSTRUCTION,
        "messages": [{"role": "user", "content": [{"type": "text", "text": user_prompt}]}],
    }

    response = _bedrock_client.invoke_model(
        modelId=_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=dumps(config),
    )

    body = loads(response["body"].read())
    # Find the first text block — Haiku 4.5 may return thinking blocks before text
    raw = ""
    for block in body.get("content", []):
        if block.get("type") == "text":
            raw = block["text"].strip()
            break

    if not raw:
        raise ValueError(f"No text block in Bedrock response: {body.get('content', [])}")

    # Strip markdown fences if present (```json ... ```)
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        raw = "\n".join(lines).strip()

    try:
        result = loads(raw)
    except Exception:
        raise ValueError(f"Failed to parse LLM response as JSON. Raw: {raw[:500]}")
    score = int(result["score"])
    if score < 1 or score > 5:
        raise ValueError(f"LLM returned out-of-range score: {score}")

    return {"score": score, "justification": result.get("justification", "")}


# ---------------------------------------------------------------------------
# Handler
# ---------------------------------------------------------------------------

def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Score the severity of a flagged skill.

    Step Function stage — receives native JSON, returns native JSON.
    All input fields are passed through; {score, justification} are added.

    Raises on error (Step Functions catches as a failed state).
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    content: str = (event.get("content") or "").strip()
    if isnullstr(content):
        raise ValueError("Missing required parameter: 'content'")

    bucket: str = (event.get("bucket") or "").strip().lower()
    if bucket not in _VALID_BUCKETS:
        raise ValueError(f"Invalid bucket: {bucket!r}. Must be one of: {sorted(_VALID_BUCKETS)}")

    slug: str = event.get("slug", "unknown")
    author_id: str = event.get("author_id", "")

    logger.info(f"Resolved Params: {dumps({'slug': slug, 'bucket': bucket, 'author_id': author_id, 'content_length': len(content)})}")
    logger.info(f"Scoring skill: slug={slug} bucket={bucket} chars={len(content)}")

    result = _score(content, bucket)

    logger.info(f"Scoring result: slug={slug} bucket={bucket} score={result['score']}")

    # Pass through all input fields and enrich with scoring result
    output = {**event, **result}
    logger.info(f"Return Value: {dumps(output)}")
    return output
