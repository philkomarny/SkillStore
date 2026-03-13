#!/usr/bin/env python
"""Extract plain text from a PDF stored in the global document store.

Primary strategy: pdfplumber (text-based PDFs).
Fallback strategy: Tesseract OCR (scanned/image PDFs where pdfplumber
yields < 50 average characters per page).

Idempotent: if text.txt already exists in the global store, extraction
is skipped and the existing result is returned.

Input (JSON body):
    md5  (str, required): 32-character hex MD5 hash of the document.

Output (200 — success):
    { "md5": "<hash>", "status": "ready", "char_count": 4821 }

Output (200 — already extracted):
    { "md5": "<hash>", "status": "ready", "skipped": true }

Output (400):  missing md5.
Output (404):  document not found in global store.
Output (422):  extraction produced no text.
Output (500):  storage or extraction failure.

Related: philkomarny/SkillStore#15, philkomarny/SkillStore#14
"""

import io
from json import dumps, loads
import os
from datetime import datetime, timezone
from logging import Logger
from typing import Any

import boto3
import pdfplumber
import pytesseract
from botocore.exceptions import ClientError
from PIL import Image

from skillstore_base import configure_logger, isnullstr

BUCKET_NAME: str = os.getenv("BUCKET_NAME", "mskillsiq")

# S3 layout — https://github.com/philkomarny/SkillStore/issues/16:
#   store      — raw uploads:  eduskillsmp/documents/store/<md5[:2]>/<md5>.json
#                               eduskillsmp/documents/store/<md5[:2]>/<md5>.pdf  (or other ext)
#   text-store — extracted:    eduskillsmp/documents/text-store/<md5[:2]>/<md5>.txt
_STORE_PREFIX = "eduskillsmp/documents/store"
_TEXT_STORE_PREFIX = "eduskillsmp/documents/text-store"

# If pdfplumber returns fewer than this many characters per page on average,
# the PDF is likely a scanned image and Tesseract OCR is applied instead.
_TEXT_DENSITY_THRESHOLD = 50

s3_client = boto3.client("s3")
logger: Logger = configure_logger(__name__)


def _metadata_key(md5: str) -> str:
    """Return the S3 key for a document's metadata JSON."""
    return f"{_STORE_PREFIX}/{md5[:2]}/{md5}.json"


def _original_key(md5: str, ext: str) -> str:
    """Return the S3 key for a document's original file bytes."""
    return f"{_STORE_PREFIX}/{md5[:2]}/{md5}{ext}"


def _text_key(md5: str) -> str:
    """Return the S3 key for a document's extracted text."""
    return f"{_TEXT_STORE_PREFIX}/{md5[:2]}/{md5}.txt"


def _text_already_extracted(md5: str) -> bool:
    """Return True if text.txt already exists — idempotent retry guard."""
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=_text_key(md5))
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "404":
            return False
        raise


def _read_metadata(md5: str) -> dict:
    """Read and return the document's metadata.json."""
    obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_metadata_key(md5))
    return loads(obj["Body"].read())


def _read_original(md5: str, ext: str) -> bytes:
    """Read the original file bytes from S3."""
    obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=_original_key(md5, ext))
    return obj["Body"].read()


def _write_text(md5: str, text: str) -> None:
    """Write extracted plain text to text.txt in the global store."""
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_text_key(md5),
        Body=text.encode("utf-8"),
        ContentType="text/plain",
    )


def _update_metadata(md5: str, metadata: dict, status: str) -> None:
    """Update metadata.json with new status and extraction timestamp."""
    metadata["status"] = status
    metadata["text_extracted"] = status == "ready"
    metadata["extracted_at"] = datetime.now(tz=timezone.utc).isoformat()
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=_metadata_key(md5),
        Body=dumps(metadata, indent=2),
        ContentType="application/json",
    )


def _extract_with_pdfplumber(raw_bytes: bytes) -> tuple[str, bool]:
    """Extract text using pdfplumber.

    Returns:
        Tuple of (extracted_text, is_sparse) where is_sparse=True means
        the PDF is likely scanned and Tesseract OCR should be attempted.
    """
    pages = []
    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            pages.append(text)

    full_text = "\n\n".join(pages).strip()
    avg_chars = len(full_text) / max(len(pages), 1)
    is_sparse = avg_chars < _TEXT_DENSITY_THRESHOLD

    return full_text, is_sparse


def _extract_with_tesseract(raw_bytes: bytes) -> str:
    """Extract text from a scanned PDF using Tesseract OCR.

    Renders each page as an image via pdfplumber then runs pytesseract.
    """
    pages_text = []
    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        for page in pdf.pages:
            img = page.to_image(resolution=200).original
            if not isinstance(img, Image.Image):
                img = Image.open(io.BytesIO(img))
            page_text = pytesseract.image_to_string(img)
            pages_text.append(page_text.strip())

    return "\n\n".join(pages_text).strip()


def _error(message: str, status: int = 500) -> dict[str, Any]:
    logger.error(message)
    return {"statusCode": status, "body": dumps({"message": message})}


def handler(event: dict[str, Any], _) -> dict[str, Any]:
    """Extract plain text from a PDF document.

    Reads original.pdf from the global store, extracts text via pdfplumber
    (with Tesseract OCR fallback for scanned pages), writes text.txt, and
    flips metadata.json status to 'ready'.

    Args:
        event: Lambda invocation event with JSON body fields.

    Returns:
        200 { md5, status, char_count } on success.
        200 { md5, status, skipped } if already extracted.
        400 { message } for missing md5.
        404 { message } when document not found.
        422 { message } when extraction yields no text.
        500 { message } on failure.
    """
    logger.info(f"Incoming Event: {dumps(event)}")

    params = event
    if isinstance(event.get("body"), str):
        try:
            params = loads(event["body"])
        except Exception as exc:
            return _error(f"Invalid JSON body: {exc}", status=400)

    md5: str = (params.get("md5") or "").strip().lower()
    if isnullstr(md5):
        return _error("Missing required parameter: 'md5'", status=400)

    logger.info(f"Resolved Params: {dumps({'md5': md5})}")

    # Idempotency: skip if text.txt already exists.
    if _text_already_extracted(md5):
        logger.info(f"text.txt already exists for md5={md5}; skipping")
        try:
            metadata = _read_metadata(md5)
            if metadata.get("status") != "ready":
                _update_metadata(md5, metadata, "ready")
        except Exception:
            pass
        return {"statusCode": 200, "body": dumps({"md5": md5, "status": "ready", "skipped": True})}

    # Read metadata to confirm document exists and get file extension.
    try:
        metadata = _read_metadata(md5)
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return _error(f"Document not found: {md5}", status=404)
        raise

    ext = metadata.get("ext", ".pdf")
    filename = metadata.get("filename", "unknown")
    size_bytes = metadata.get("size_bytes", 0)
    logger.info(f"Extracting PDF: md5={md5} filename={filename} size={size_bytes}b")

    try:
        raw_bytes = _read_original(md5, ext)
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return _error(f"Original file not found for md5={md5}", status=404)
        raise

    # Attempt pdfplumber first; fall back to Tesseract for scanned PDFs.
    text, is_sparse = _extract_with_pdfplumber(raw_bytes)
    logger.info(f"pdfplumber: md5={md5} chars={len(text)} sparse={is_sparse}")
    if is_sparse:
        logger.info(f"Sparse text detected; switching to Tesseract OCR for md5={md5}")
        text = _extract_with_tesseract(raw_bytes)

    if not text.strip():
        _update_metadata(md5, metadata, "error")
        return _error(f"Extraction produced no text for md5={md5}", status=422)

    # Write order: text first, then status flip — idempotent on retry.
    _write_text(md5, text)
    _update_metadata(md5, metadata, "ready")

    logger.info(f"PDF extraction complete: md5={md5} chars={len(text)} ocr={'yes' if is_sparse else 'no'}")
    result = {"statusCode": 200, "body": dumps({"md5": md5, "status": "ready", "char_count": len(text)})}
    logger.info(f"Return Value: {dumps(result)}")
    return result
