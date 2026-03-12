#!/usr/bin/env python
"""End-to-end smoke test: delete → upload PDF → wait → print extracted text.

Workflow:
    1. Delete the test document from the caller's library (graceful — 404 is ok).
    2. Upload integration-test.pdf via esm-live-upload-document-api.
    3. Poll esm-live-get-document-api until status leaves 'processing'.
    4. Print the extracted text and total elapsed time.

All invocations hit REAL deployed AWS API Gateways. No mocks.

Run with:
    cd tests && AWS_PROFILE=transcriptiq_lambdaserviceuser poetry run pytest \
        lambdas/test_pdf_pipeline_e2e.py -v -s --noconftest
"""

from __future__ import annotations

import base64
import hashlib
import time
from pathlib import Path

import requests

_FIXTURES = Path(__file__).parent.parent / "fixtures"

# ── API Gateway URLs (SkillStore#28) ──────────────────────────────────

_URL_UPLOAD = "https://plvh12o05c.execute-api.us-west-2.amazonaws.com/prod/esm_live_upload_document_post"
_URL_GET    = "https://ikt0pbkcx1.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_document_get"
_URL_DELETE = "https://l9h3c7vji5.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_document_delete"

_TEST_USER = "999000000000000000001"  # https://github.com/philkomarny/SkillStore/issues/27
_TEST_FILE = "integration-test.pdf"
_LONG_PDF_FILE = "2403.05440v1.pdf"
_MAX_PDF_FILE = "jurafsky-nlp-max.pdf"

# ── Helpers ────────────────────────────────────────────────────────────────────


def _post(url: str, payload: dict) -> dict:
    resp = requests.post(url, json=payload, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _get(url: str, params: dict) -> dict:
    resp = requests.get(url, params=params, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _delete_if_exists(md5: str) -> None:
    """Delete document from the test user's library; 404 is silently ignored."""
    resp = requests.delete(_URL_DELETE, params={"md5": md5, "user_id": _TEST_USER}, timeout=60)
    if resp.status_code == 200:
        print(f"  → pre-delete: removed md5={md5} from library")
    elif resp.status_code == 404:
        print(f"  → pre-delete: md5={md5} not in library (nothing to delete)")
    else:
        print(f"  → pre-delete: unexpected status={resp.status_code}  (continuing anyway)")


def _upload(filename: str, raw_bytes: bytes) -> str:
    """Upload bytes via API Gateway and return the md5 hash."""
    size_kb = len(raw_bytes) / 1024
    print(f"  → uploading {filename} ({size_kb:.1f} KB) ...")
    result = _post(_URL_UPLOAD, {
        "filename": filename,
        "user_id": _TEST_USER,
        "file_content": base64.b64encode(raw_bytes).decode(),
    })
    assert result["statusCode"] in (200, 201), f"Upload failed: {result}"
    body = result["body"]
    md5 = body["md5"]
    assert md5, "Upload returned no md5"
    print(f"  ✓ uploaded   md5={md5}  existed={body.get('existed', False)}  status={body.get('status')}")
    return md5


def _poll_until_ready(md5: str, timeout_s: int = 300, interval_s: int = 5) -> dict:
    """Poll GET /esm_live_get_document_get?md5=... until status leaves 'processing'."""
    print(f"  → polling (timeout={timeout_s}s, interval={interval_s}s) ...")
    deadline = time.monotonic() + timeout_s
    t0 = time.monotonic()
    attempt = 0
    while time.monotonic() < deadline:
        attempt += 1
        elapsed = int(time.monotonic() - t0)
        result = _get(_URL_GET, {"md5": md5})
        assert result["statusCode"] == 200, f"get-document error: {result}"
        body = result["body"]
        status = body.get("status")
        print(f"  [{elapsed:>3}s / attempt {attempt}]  status={status}")
        if status != "processing":
            return body
        time.sleep(interval_s)
    raise AssertionError(f"Document {md5} still 'processing' after {timeout_s}s")


def _print_text_preview(text: str, max_chars: int = 1500) -> None:
    truncated = len(text) > max_chars
    preview = text[:max_chars]
    print()
    print("  ─── extracted text ───────────────────────────────────────────────────")
    for line in preview.splitlines():
        print(f"  {line}")
    if truncated:
        print(f"  ... [{len(text) - max_chars} more chars not shown]")
    print("  ──────────────────────────────────────────────────────────────────────")


# ── Tests ───────────────────────────────────────────────────────────────────────


def test_pdf_e2e():
    """Delete existing copy (if any), upload PDF, wait for extraction, print text."""
    raw_bytes = (_FIXTURES / _TEST_FILE).read_bytes()
    expected_md5 = hashlib.md5(raw_bytes).hexdigest()
    print(f"\n  fixture: {_TEST_FILE}  md5={expected_md5}  size={len(raw_bytes):,} bytes")

    t_start = time.monotonic()
    _delete_if_exists(expected_md5)
    md5 = _upload(_TEST_FILE, raw_bytes)
    assert md5 == expected_md5, f"Server md5 {md5} != expected {expected_md5}"
    body = _poll_until_ready(md5)
    elapsed = time.monotonic() - t_start

    status = body.get("status")
    text = body.get("text") or ""
    print(f"\n  status      : {status}")
    print(f"  char_count  : {len(text):,}")
    print(f"  total time  : {elapsed:.1f}s")
    _print_text_preview(text)

    assert status == "ready", f"Expected 'ready', got: {status}"
    assert text, "Extracted text is empty"


def test_pdf_e2e_max():
    """Max-size performance test: upload a ~19.6 MB PDF (just under the 20 MB limit)."""
    raw_bytes = (_FIXTURES / _MAX_PDF_FILE).read_bytes()
    expected_md5 = hashlib.md5(raw_bytes).hexdigest()
    print(f"\n  fixture: {_MAX_PDF_FILE}  md5={expected_md5}  size={len(raw_bytes):,} bytes")

    t_start = time.monotonic()
    _delete_if_exists(expected_md5)
    md5 = _upload(_MAX_PDF_FILE, raw_bytes)
    assert md5 == expected_md5, f"Server md5 {md5} != expected {expected_md5}"
    body = _poll_until_ready(md5, timeout_s=600)
    elapsed = time.monotonic() - t_start

    status = body.get("status")
    text = body.get("text") or ""
    print(f"\n  status      : {status}")
    print(f"  char_count  : {len(text):,}")
    print(f"  total time  : {elapsed:.1f}s")
    _print_text_preview(text)

    assert status == "ready", f"Expected 'ready', got: {status}"
    assert text, "Extracted text is empty"


def test_pdf_e2e_long():
    """Performance test: upload a longer PDF and measure extraction time."""
    raw_bytes = (_FIXTURES / _LONG_PDF_FILE).read_bytes()
    expected_md5 = hashlib.md5(raw_bytes).hexdigest()
    print(f"\n  fixture: {_LONG_PDF_FILE}  md5={expected_md5}  size={len(raw_bytes):,} bytes")

    t_start = time.monotonic()
    _delete_if_exists(expected_md5)
    md5 = _upload(_LONG_PDF_FILE, raw_bytes)
    assert md5 == expected_md5, f"Server md5 {md5} != expected {expected_md5}"
    body = _poll_until_ready(md5, timeout_s=600)
    elapsed = time.monotonic() - t_start

    status = body.get("status")
    text = body.get("text") or ""
    print(f"\n  status      : {status}")
    print(f"  char_count  : {len(text):,}")
    print(f"  total time  : {elapsed:.1f}s")
    _print_text_preview(text)

    assert status == "ready", f"Expected 'ready', got: {status}"
    assert text, "Extracted text is empty"
