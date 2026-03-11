#!/usr/bin/env python
"""Integration test: upload a PNG and verify Tesseract OCR extracts plain text.

Uploads a Pillow-generated PNG via esm-live-upload-document-api, waits for the
async esm-live-extract-image-text Lambda to complete, then asserts the
returned text is non-empty.  Cleans up the document after the test.

Skipped automatically if Pillow is not installed.

All invocations hit REAL deployed AWS API Gateways. No mocks.

Run with:
    cd tests && AWS_PROFILE=transcriptiq_lambdaserviceuser poetry run pytest \
        lambdas/test_upload_image_pipeline.py -v -s --noconftest
"""

from __future__ import annotations

import base64
import io
import time

import pytest
import requests

# ── API Gateway URLs (febelabs/skillflow#141) ──────────────────────────────────

_URL_UPLOAD = "https://plvh12o05c.execute-api.us-west-2.amazonaws.com/prod/esm_live_upload_document_post"
_URL_GET    = "https://ikt0pbkcx1.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_document_get"
_URL_DELETE = "https://l9h3c7vji5.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_document_delete"

_TEST_USER = "999000000000000000001"  # https://github.com/febelabs/skillflow/issues/140

# ── Helpers ───────────────────────────────────────────────────────────────────


def _post(url: str, payload: dict) -> dict:
    resp = requests.post(url, json=payload, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _get(url: str, params: dict) -> dict:
    resp = requests.get(url, params=params, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _upload(filename: str, raw_bytes: bytes) -> str:
    """Upload bytes via API Gateway and return the md5 hash."""
    size_kb = len(raw_bytes) / 1024
    print(f"\n  → uploading {filename} ({size_kb:.1f} KB) to esm-live-upload-document ...")
    result = _post(_URL_UPLOAD, {
        "filename": filename,
        "user_id": _TEST_USER,
        "file_content": base64.b64encode(raw_bytes).decode(),
    })
    assert result["statusCode"] in (200, 201), f"Upload failed: {result}"
    body = result["body"]
    md5 = body["md5"]
    assert md5, "Upload returned no md5"
    print(f"  ✓ uploaded  md5={md5}  existed={body.get('existed', False)}  status={body.get('status')}")
    return md5


def _delete(md5: str) -> None:
    """Delete a document; log outcome, never raise."""
    resp = requests.delete(_URL_DELETE, params={"md5": md5, "user_id": _TEST_USER}, timeout=60)
    if resp.status_code == 200:
        print(f"  → deleted  md5={md5}")
    elif resp.status_code == 404:
        print(f"  → delete skipped  md5={md5}  (document not found)")
    else:
        print(f"  → delete returned {resp.status_code}  md5={md5}")


def _poll_until_ready(md5: str, timeout_s: int = 120, interval_s: int = 5) -> dict:
    """Poll GET /esm_live_get_document_get?md5=... until status leaves 'processing'."""
    print(f"  → polling esm-live-get-document (timeout={timeout_s}s, interval={interval_s}s) ...")
    deadline = time.monotonic() + timeout_s
    attempt = 0
    while time.monotonic() < deadline:
        attempt += 1
        elapsed = int(time.monotonic() - (deadline - timeout_s))
        result = _get(_URL_GET, {"md5": md5})
        assert result["statusCode"] == 200, f"get-document error: {result}"
        body = result["body"]
        status = body.get("status")
        print(f"  [{elapsed:>3}s / attempt {attempt}]  status={status}")
        if status != "processing":
            return body
        time.sleep(interval_s)
    raise AssertionError(f"Document {md5} still 'processing' after {timeout_s}s")


def _png_bytes() -> bytes:
    """Generate a PNG with readable text using Pillow."""
    from PIL import Image, ImageDraw  # noqa: PLC0415

    img = Image.new("RGB", (400, 100), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((10, 30), "Integration test SkillStore OCR", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _try_import_pillow() -> bool:
    try:
        import PIL  # noqa: F401, PLC0415
        return True
    except ImportError:
        return False


# ── Test ──────────────────────────────────────────────────────────────────────


@pytest.mark.skipif(
    not _try_import_pillow(),
    reason="Pillow not installed — skipping image OCR test",
)
def test_png_upload_creates_plain_text():
    """Upload a .png with text and verify Tesseract OCR extracts it."""
    md5 = _upload("integration-test.png", _png_bytes())
    try:
        body = _poll_until_ready(md5, timeout_s=900)
        assert body["status"] == "ready", f"Expected ready, got: {body['status']}"
        assert body.get("text"), "text field is empty or null"
        print(f"  ✓ text extracted  char_count={len(body['text'])}")
    finally:
        _delete(md5)
