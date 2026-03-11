#!/usr/bin/env python
"""Integration test: upload a PDF and verify pdfplumber extracts plain text.

Uploads a real PDF to esm-live-upload-document, waits for the async
esm-live-extract-pdf-text Lambda to complete, then asserts the returned
text is non-empty.  Cleans up the document after the test.

All invocations hit REAL deployed AWS Lambda functions. No mocks.

Run with:
    cd tests && AWS_PROFILE=transcriptiq_lambdaserviceuser poetry run pytest \
        lambdas/test_upload_pdf_pipeline.py -v -s --noconftest
"""

from __future__ import annotations

import base64
import json
import os
import time
from pathlib import Path

import boto3

_FIXTURES = Path(__file__).parent.parent / "fixtures"

# ── AWS client ────────────────────────────────────────────────────────────────

_PROFILE = os.environ.get("AWS_PROFILE", "transcriptiq_lambdaserviceuser")
_REGION = os.environ.get("AWS_REGION", "us-west-2")
_SESSION = boto3.Session(profile_name=_PROFILE, region_name=_REGION)
_LAMBDA = _SESSION.client("lambda")

_TEST_USER = "999000000000000000001"  # https://github.com/febelabs/skillflow/issues/140

# ── Helpers ───────────────────────────────────────────────────────────────────


def _invoke(function_name: str, payload: dict) -> dict:
    response = _LAMBDA.invoke(
        FunctionName=function_name,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload).encode(),
    )
    if "FunctionError" in response:
        raw = response["Payload"].read().decode()
        raise AssertionError(f"Lambda error ({function_name}): {raw}")
    raw = response["Payload"].read().decode()
    return json.loads(raw)


def _upload(filename: str, raw_bytes: bytes) -> str:
    """Upload bytes to esm-live-upload-document and return the md5 hash."""
    size_kb = len(raw_bytes) / 1024
    print(f"\n  → uploading {filename} ({size_kb:.1f} KB) to esm-live-upload-document ...")
    payload = {
        "filename": filename,
        "user_id": _TEST_USER,
        "file_content": base64.b64encode(raw_bytes).decode(),
    }
    result = _invoke("esm-live-upload-document", payload)
    assert result["statusCode"] in (200, 201), f"Upload failed: {result}"
    body = json.loads(result["body"]) if isinstance(result["body"], str) else result["body"]
    md5 = body["md5"]
    assert md5, "Upload returned no md5"
    existed = body.get("existed", False)
    print(f"  ✓ uploaded  md5={md5}  existed={existed}  status={body.get('status')}")
    return md5


def _delete(md5: str) -> None:
    """Delete a document from the global store; log outcome, never raise."""
    result = _invoke("esm-live-delete-document", {"md5": md5, "user_id": _TEST_USER})
    status = result.get("statusCode")
    if status == 200:
        print(f"  → deleted  md5={md5}")
    elif status == 404:
        print(f"  → delete skipped  md5={md5}  (document not found)")
    else:
        body = json.loads(result["body"]) if isinstance(result.get("body"), str) else result.get("body", {})
        print(f"  → delete returned {status}  md5={md5}  body={body}")


def _poll_until_ready(md5: str, timeout_s: int = 120, interval_s: int = 5) -> dict:
    """Poll esm-live-get-document until status is no longer 'processing'.

    Returns the parsed response body.  Raises AssertionError on timeout.
    """
    print(f"  → polling esm-live-get-document (timeout={timeout_s}s, interval={interval_s}s) ...")
    deadline = time.monotonic() + timeout_s
    attempt = 0
    while time.monotonic() < deadline:
        attempt += 1
        elapsed = int(time.monotonic() - (deadline - timeout_s))
        result = _invoke("esm-live-get-document", {"md5": md5})
        assert result["statusCode"] == 200, f"get-document error: {result}"
        body = json.loads(result["body"]) if isinstance(result["body"], str) else result["body"]
        status = body.get("status")
        print(f"  [{elapsed:>3}s / attempt {attempt}]  status={status}")
        if status != "processing":
            return body
        time.sleep(interval_s)

    raise AssertionError(f"Document {md5} still 'processing' after {timeout_s}s")


# ── Test ──────────────────────────────────────────────────────────────────────


def test_pdf_upload_creates_plain_text():
    """Upload a .pdf and verify pdfplumber extracts text."""
    raw_bytes = (_FIXTURES / "integration-test.pdf").read_bytes()
    md5 = _upload("integration-test.pdf", raw_bytes)
    try:
        body = _poll_until_ready(md5, timeout_s=900)
        assert body["status"] == "ready", f"Expected ready, got: {body['status']}"
        assert body.get("text"), "text field is empty or null"
        assert len(body["text"]) > 10, f"text suspiciously short: {body['text']!r}"
        print(f"  ✓ text extracted  char_count={len(body['text'])}")
    finally:
        _delete(md5)
