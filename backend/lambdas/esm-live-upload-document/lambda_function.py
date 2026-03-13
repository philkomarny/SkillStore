#!/usr/bin/env python
"""Upload a document to the global content-addressable store.

Documents are keyed by MD5 hash of file content.  Uploading an identical
file a second time (from any user) returns the existing record — no
duplicate storage, no duplicate text extraction.

The Lambda stores the raw file, marks the document as ``processing``, then
asynchronously invokes the appropriate OCR/extraction Lambda based on file
extension.  The caller should poll GET /documents/{md5} until
``status == "ready"``.

Input — multipart/form-data (preferred):
    file     (file, required): the document to upload.
    user_id  (str,  required): caller's identity (Google OAuth subject ID).

Input — JSON body (legacy, still supported):
    file_content  (str, required): base64-encoded file bytes.
    filename      (str, required): original filename, e.g. "lecture-notes.pdf".
    user_id       (str, required): caller's identity (Google OAuth subject ID).
    mime_type     (str, optional): MIME type; inferred from filename extension
                                   when omitted.

Output (201 — new document):
    { "md5": "<hash>", "status": "processing", "existed": false }

Output (200 — duplicate):
    { "md5": "<hash>", "status": "<current_status>", "existed": true }

Output (400):  missing / invalid parameters.
Output (413):  file exceeds 10 MB size limit (API Gateway ceiling).
Output (415):  unsupported file extension.
Output (500):  storage failure.

Related: philkomarny/SkillStore#14, #35
"""

import base64
from email import policy
from email.parser import BytesParser
import hashlib
from json import dumps, loads
import mimetypes
import os
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3
from botocore.exceptions import ClientError

from skillstore_base import configure_logger, isnullstr, validate_google_sub

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# https://github.com/philkomarny/SkillStore/issues/25
# API Gateway REST hard limit is 10 MB. With multipart (preferred path) there is no base64
# overhead, so the full 10 MB is usable. We enforce 10 MB here so the Lambda rejects oversized
# payloads with a clean 413 rather than AWS silently dropping the request.
_MAX_FILE_BYTES: int = 10 * 1024 * 1024  # 10 MB

# Supported extensions and the extraction Lambda that handles each group.
_OCR_LAMBDA: dict[str, str] = {
    ".pdf":  "esm-live-extract-pdf-text",
    ".docx": "esm-live-extract-docx-text",
    ".pptx": "esm-live-extract-docx-text",
    ".txt":  "esm-live-extract-docx-text",
    ".md":   "esm-live-extract-docx-text",
    ".jpg":  "esm-live-extract-image-text",
    ".jpeg": "esm-live-extract-image-text",
    ".png":  "esm-live-extract-image-text",
    ".webp": "esm-live-extract-image-text",
}

_SUPPORTED_EXTENSIONS: frozenset[str] = frozenset(_OCR_LAMBDA)

# S3 layout (all under bucket BUCKET_NAME) — https://github.com/philkomarny/SkillStore/issues/16:
#   store      — raw uploads:  eduskillsmp/documents/store/<md5[:2]>/<md5>.json   ← metadata
#                               eduskillsmp/documents/store/<md5[:2]>/<md5>.<ext>  ← original file
#   text-store — extracted:    eduskillsmp/documents/text-store/<md5[:2]>/<md5>.txt  ← plain text
#   user-store — user library: eduskillsmp/documents/user-store/<user_id>/<md5>.json
_STORE_PREFIX = "eduskillsmp/documents/store"
_USER_STORE_PREFIX = "eduskillsmp/documents/user-store"

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

s3_client = boto3.client("s3")
lambda_client = boto3.client("lambda")
logger: Logger = configure_logger(__name__)


def _metadata_key(md5: str) -> str:
    """Return the S3 key for a document's metadata JSON."""
    return f"{_STORE_PREFIX}/{md5[:2]}/{md5}.json"


def _original_key(md5: str, ext: str) -> str:
    """Return the S3 key for a document's original file bytes."""
    return f"{_STORE_PREFIX}/{md5[:2]}/{md5}{ext}"


def _library_key(user_id: str, md5: str) -> str:
    """Return the S3 key for a user's library reference to a document."""
    return f"{_USER_STORE_PREFIX}/{user_id}/{md5}.json"


def _document_exists(md5: str) -> bool:
    """Return True if the document is already in the global store."""
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=_metadata_key(md5))
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "404":
            return False
        raise


def _read_metadata(md5: str) -> dict:
    """Read and return the document's metadata.json from the global store."""
    obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_metadata_key(md5))
    return loads(obj["Body"].read())


def _write_metadata(md5: str, metadata: dict) -> None:
    """Write metadata.json to the global store."""
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_metadata_key(md5),
        Body=dumps(metadata, indent=2),
        ContentType="application/json",
    )


def _write_original(md5: str, ext: str, raw_bytes: bytes, mime_type: str) -> None:
    """Write the original file bytes to the global store."""
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_original_key(md5, ext),
        Body=raw_bytes,
        ContentType=mime_type,
    )


def _add_to_library(user_id: str, md5: str, filename: str) -> None:
    """Create or overwrite the user's library reference for a document."""
    ref = {
        "md5": md5,
        "filename": filename,
        "added_at": datetime.now(tz=timezone.utc).isoformat(),
    }
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_library_key(user_id, md5),
        Body=dumps(ref, indent=2),
        ContentType="application/json",
    )


def _trigger_extraction(md5: str, ext: str) -> None:
    """Asynchronously invoke the correct extraction Lambda for this file type.

    Uses InvocationType='Event' so the upload Lambda returns immediately
    without waiting for OCR (which can take up to 5 minutes for scanned PDFs).
    """
    function_name = _OCR_LAMBDA[ext]
    payload = dumps({"md5": md5}).encode()
    lambda_client.invoke(
        FunctionName=function_name,
        InvocationType="Event",
        Payload=payload,
    )
    logger.info(f"Triggered extraction: fn={function_name} md5={md5}")


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "headers": _CORS_HEADERS, "body": dumps({"message": message})}


def _parse_multipart(event: dict[str, Any]) -> dict[str, Any]:
    """Parse a multipart/form-data body from API Gateway into {raw_bytes, filename, user_id, mime_type}.

    Uses the stdlib email parser — no third-party dependencies required.
    https://github.com/philkomarny/SkillStore/issues/35
    """
    content_type = ""
    for k, v in (event.get("headers") or {}).items():
        if k.lower() == "content-type":
            content_type = v
            break

    body_str: str = event.get("body", "")
    if event.get("isBase64Encoded"):
        body_bytes = base64.b64decode(body_str)
    else:
        body_bytes = body_str.encode("utf-8") if isinstance(body_str, str) else body_str

    # Build a MIME message so the stdlib parser can split parts for us.
    mime_bytes = f"Content-Type: {content_type}\r\n\r\n".encode() + body_bytes
    msg = BytesParser(policy=policy.default).parsebytes(mime_bytes)

    raw_bytes: bytes | None = None
    filename: str = ""
    mime_type: str = ""
    user_id: str = ""

    for part in msg.iter_parts():
        cd = part.get("Content-Disposition", "")
        if 'name="file"' in cd or "name=file" in cd:
            raw_bytes = part.get_payload(decode=True)
            # Extract filename from Content-Disposition header
            fn = part.get_filename()
            if fn:
                filename = fn
            mime_type = part.get_content_type()
        elif 'name="user_id"' in cd or "name=user_id" in cd:
            payload = part.get_payload(decode=True)
            if payload:
                user_id = payload.decode("utf-8").strip()

    return {"raw_bytes": raw_bytes, "filename": filename, "user_id": user_id, "mime_type": mime_type}


def _is_multipart(event: dict[str, Any]) -> bool:
    """Return True if the request Content-Type is multipart/form-data."""
    for k, v in (event.get("headers") or {}).items():
        if k.lower() == "content-type" and "multipart/form-data" in v.lower():
            return True
    return False


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Upload a document and register it in the caller's library.

    Args:
        event: API Gateway proxy event (multipart or JSON body).

    Returns:
        201 { md5, status, existed } for new documents.
        200 { md5, status, existed } for duplicates.
        400 { message } for missing/invalid parameters.
        500 { message } on storage failure.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    # https://github.com/philkomarny/SkillStore/issues/35
    if _is_multipart(event):
        parsed = _parse_multipart(event)
        raw_bytes: bytes | None = parsed["raw_bytes"]
        if raw_bytes is None:
            return _error("Multipart body missing 'file' field", status=400)
        filename = parsed["filename"]
        user_id = parsed["user_id"]
        mime_type = parsed["mime_type"]
    else:
        # Legacy JSON path: base64-encoded file_content
        params = event
        if isinstance(event.get("body"), str):
            try:
                params = loads(event["body"])
            except Exception as exc:
                return _error(f"Invalid JSON body: {exc}", status=400)

        file_content_b64: str = (params.get("file_content") or "").strip()
        if isnullstr(file_content_b64):
            return _error("Missing required parameter: 'file_content'", status=400)

        filename = (params.get("filename") or "").strip()
        user_id = (params.get("user_id") or "").strip()
        mime_type = (params.get("mime_type") or "").strip()

        try:
            raw_bytes = base64.b64decode(file_content_b64)
        except Exception as exc:
            return _error(f"'file_content' is not valid base64: {exc}", status=400)

    if isnullstr(filename):
        return _error("Missing required parameter: 'filename'", status=400)

    err = validate_google_sub(user_id)  # https://github.com/philkomarny/SkillStore/issues/27
    if err:
        return _error(err, status=400)

    ext = os.path.splitext(filename)[1].lower()  # e.g. ".pdf"
    if ext not in _SUPPORTED_EXTENSIONS:
        return _error(
            f"Unsupported file type: '{ext}' — supported: {sorted(_SUPPORTED_EXTENSIONS)}",
            status=415,
        )

    if len(raw_bytes) > _MAX_FILE_BYTES:  # https://github.com/philkomarny/SkillStore/issues/25
        mb = len(raw_bytes) / (1024 * 1024)
        return _error(f"File too large: {mb:.1f} MB — limit is 10 MB", status=413)

    if not mime_type:
        mime_type, _ = mimetypes.guess_type(filename)
        mime_type = mime_type or "application/octet-stream"

    md5 = hashlib.md5(raw_bytes).hexdigest()  # noqa: S324 — used for dedup, not security

    logger.info(f"Resolved Params: {dumps({'filename': filename, 'user_id': user_id, 'mime_type': mime_type, 'md5': md5, 'size_bytes': len(raw_bytes)})}")

    # Idempotency: if document already in global store, just update library ref.
    if _document_exists(md5):
        existing = _read_metadata(md5)
        _add_to_library(user_id, md5, filename)
        logger.info(f"Duplicate upload; md5={md5} already in store; user={user_id}")
        result = {
            "statusCode": 200,
            "headers": _CORS_HEADERS,
            "body": dumps({"md5": md5, "status": existing.get("status", "processing"), "existed": True}),
        }
        logger.info(f"Return Value: {dumps(result)}")
        return result

    metadata = {
        "md5": md5,
        "filename": filename,
        "size_bytes": len(raw_bytes),
        "mime_type": mime_type,
        "ext": ext,
        "status": "processing",
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
        "text_extracted": False,
    }

    _write_metadata(md5, metadata)
    _write_original(md5, ext, raw_bytes, mime_type)
    _add_to_library(user_id, md5, filename)
    _trigger_extraction(md5, ext)

    result = {
        "statusCode": 201,
        "headers": _CORS_HEADERS,
        "body": dumps({"md5": md5, "status": "processing", "existed": False}),
    }
    logger.info(f"Return Value: {dumps(result)}")
    return result
