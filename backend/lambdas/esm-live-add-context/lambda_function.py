#!/usr/bin/env python
"""Create a context — a named LLM synthesis over a set of documents.

Validates that all referenced document MD5s exist in the global store and
have status ``ready``.  Fetches plain text for each document, synthesizes a
structured markdown context via Claude Haiku, and writes the result to S3.

Input:
    name       (str, required): human-readable context name.
    documents  (list[str], required): MD5 hashes of source documents.
    user_id    (str, required): owner of this context (Google OAuth subject ID).

Output (201):
    { "contextId": "ctx_<hex8>", "status": "ready" }

Output (400):
    { "message": "<reason>" }
    Returned when required fields are missing or any document is not ready.

Output (500):
    { "message": "<reason>" }

Related: https://github.com/philkomarny/SkillStore/issues/18
"""

from json import dumps, loads
import os
from datetime import datetime, timezone
from logging import Logger
from typing import Any
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError

from skillstore_base import configure_logger, isnullstr, validate_google_sub

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

_S01_PREFIX = "eduskillsmp/documents/s01"
_S02_PREFIX = "eduskillsmp/documents/s02"
_CONTEXTS_PREFIX = "eduskillsmp/contexts"  # https://github.com/febelabs/skillflow/issues/139

# Claude Haiku 4.5 via Bedrock cross-region inference
_MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"

_SYSTEM_INSTRUCTION = """\
You are an expert at synthesizing institutional documents into structured context summaries.
Given a set of document texts, produce a coherent markdown summary organised by theme.
The summary helps an AI assistant understand the institutional context, goals, and domain information.
Write clear headings. Be concise. Do not invent information not present in the source texts.\
"""

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
_bedrock_client = boto3.client("bedrock-runtime", region_name="us-west-2")
logger: Logger = configure_logger(__name__)


# ---------------------------------------------------------------------------
# S3 helpers
# ---------------------------------------------------------------------------

def _metadata_key(md5: str) -> str:
    return f"{_S01_PREFIX}/{md5[:2]}/{md5}.json"


def _text_key(md5: str) -> str:
    return f"{_S02_PREFIX}/{md5[:2]}/{md5}.txt"


def _context_metadata_key(user_id: str, context_id: str) -> str:
    # https://github.com/febelabs/skillflow/issues/139
    return f"{_CONTEXTS_PREFIX}/{user_id}/{context_id}/metadata.json"


def _context_output_key(user_id: str, context_id: str) -> str:
    # https://github.com/febelabs/skillflow/issues/139
    return f"{_CONTEXTS_PREFIX}/{user_id}/{context_id}/output.json"


def _s3_read_json(key: str) -> dict | list | None:
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
        return loads(obj["Body"].read())
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return None
        raise


def _s3_write_json(key: str, data: dict | list) -> None:
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=dumps(data, indent=2).encode("utf-8"),
        ContentType="application/json",
    )


# ---------------------------------------------------------------------------
# Document helpers
# ---------------------------------------------------------------------------

def _fetch_document_info(md5: str) -> dict | None:
    """Return document metadata dict, or None if not found."""
    meta = _s3_read_json(_metadata_key(md5))
    return meta if isinstance(meta, dict) else None


def _fetch_document_text(md5: str) -> str | None:
    try:
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_text_key(md5))
        return obj["Body"].read().decode("utf-8")
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return None
        raise


# ---------------------------------------------------------------------------
# LLM synthesis
# ---------------------------------------------------------------------------

def _synthesize(name: str, docs: list[dict]) -> str:
    """Synthesize a markdown context from the list of {filename, text} dicts."""
    sections = []
    for doc in docs:
        sections.append(f"### {doc['filename']}\n\n{doc['text'][:8000]}")
    documents_block = "\n\n---\n\n".join(sections)

    user_prompt = (
        f"Synthesise the following documents for the context named '{name}' "
        f"into a structured markdown document organised by theme:\n\n{documents_block}"
    )

    config = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "temperature": 0.3,
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
    if body.get("stop_reason") != "end_turn":
        raise RuntimeError(f"Unexpected Bedrock stop_reason: {body.get('stop_reason')}")

    return body["content"][0]["text"].strip()


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
    """Create a context by synthesising a named set of documents.

    Input fields:
        name       (str, required): context name.
        documents  (list[str], required): MD5 hashes of source documents.
        user_id    (str, required): owner of the context (Google OAuth subject ID).

    Returns:
        201 { contextId, status: "ready" } on success.
        400 { message } for missing/invalid input or unready documents.
        500 { message } on error.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)

    name: str = (params.get("name") or "").strip()
    if isnullstr(name):
        return _error("Missing required parameter: 'name'", status=400)

    documents: list = params.get("documents") or []
    if not isinstance(documents, list) or not documents:
        return _error("'documents' must be a non-empty list of MD5 hashes", status=400)

    user_id: str = (params.get("user_id") or "").strip()  # https://github.com/febelabs/skillflow/issues/139
    err = validate_google_sub(user_id)  # https://github.com/febelabs/skillflow/issues/140
    if err:
        return _error(err, status=400)

    # Validate all documents exist and are ready.
    doc_infos: list[dict] = []
    not_ready: list[str] = []
    missing: list[str] = []

    for md5 in documents:
        md5 = (md5 or "").strip().lower()
        info = _fetch_document_info(md5)
        if info is None:
            missing.append(md5)
            continue
        if info.get("status") != "ready":
            not_ready.append(f"{md5} (status: {info.get('status')})")
            continue
        doc_infos.append(info)

    if missing:
        return _error(f"Documents not found: {missing}", status=400)

    if not_ready:
        return _error(
            f"Documents not yet ready — retry after they finish processing: {not_ready}",
            status=400,
        )

    # Fetch extracted text for each document.
    docs_with_text: list[dict] = []
    for info in doc_infos:
        md5 = info["md5"]
        text = _fetch_document_text(md5)
        if not text:
            return _error(f"Extracted text not found for document: {md5}", status=400)
        docs_with_text.append({"filename": info.get("filename", md5), "text": text})

    context_id = f"ctx_{uuid4().hex[:8]}"
    created_at = datetime.now(tz=timezone.utc).isoformat()

    doc_refs = [
        {
            "md5": info["md5"],
            "fileName": info.get("filename", ""),
            "fileType": info.get("mime_type", ""),
        }
        for info in doc_infos
    ]
    metadata = {
        "contextId": context_id,
        "name": name,
        "status": "building",
        "documents": doc_refs,
        "createdAt": created_at,
        "createdBy": user_id,
    }
    _s3_write_json(_context_metadata_key(user_id, context_id), metadata)
    logger.info(f"Context {context_id} created (building) — running synthesis")

    # Synthesise markdown.
    markdown = _synthesize(name, docs_with_text)

    # Write output and update metadata to ready.
    _s3_write_json(_context_output_key(user_id, context_id), {"markdown": markdown})
    metadata["status"] = "ready"
    _s3_write_json(_context_metadata_key(user_id, context_id), metadata)

    logger.info(f"Context {context_id} ready — {len(markdown)} chars")
    return {
        "statusCode": 201,
        "headers": _CORS_HEADERS,
        "body": dumps({"contextId": context_id, "status": "ready"}),
    }
