#!/usr/bin/env python
"""Tests for esm-live-extract-pdf-text Lambda.

Validates mechanics: input validation, idempotency, 404 on missing doc,
and success path (pdfplumber + Tesseract fallback).

All S3, pdfplumber, and pytesseract calls are mocked — no real AWS calls.

Run with:
    cd tests && poetry run pytest lambdas/test_extract_pdf_text.py -v --noconftest
"""

from __future__ import annotations

import importlib.util
import json
import sys
from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

# ── Stub Lambda-only packages before the module loads ─────────────────────────

_pdfplumber_stub = MagicMock()
_pytesseract_stub = MagicMock()
_PIL_stub = MagicMock()
_PIL_Image_stub = MagicMock()
_PIL_ImageFilter_stub = MagicMock()

sys.modules.setdefault("pdfplumber", _pdfplumber_stub)
sys.modules.setdefault("pytesseract", _pytesseract_stub)
sys.modules.setdefault("PIL", _PIL_stub)
sys.modules.setdefault("PIL.Image", _PIL_Image_stub)
sys.modules.setdefault("PIL.ImageFilter", _PIL_ImageFilter_stub)

# ── Path setup ────────────────────────────────────────────────────────────────

LAMBDA_DIR = (
    Path(__file__).parent.parent.parent
    / "lambdas"
    / "esm-live"
    / "esm-live-extract-pdf-text"
)

_mock_s3 = MagicMock()

_spec = importlib.util.spec_from_file_location(
    "lf_extract_pdf_text", LAMBDA_DIR / "lambda_function.py"
)
_mod = importlib.util.module_from_spec(_spec)
with patch("boto3.client", return_value=_mock_s3):
    _spec.loader.exec_module(_mod)
lf = _mod


# ── Helpers ───────────────────────────────────────────────────────────────────

def _s3_404() -> ClientError:
    return ClientError({"Error": {"Code": "404", "Message": "Not Found"}}, "op")


def _make_body(data: dict) -> MagicMock:
    body = MagicMock()
    body.read.return_value = json.dumps(data).encode()
    return body


def _call(event: dict) -> dict:
    return lf.handler(event, None)


_DENSE_TEXT = "A" * 200  # well above the 50-char sparse threshold


def _setup_happy_path(text: str = _DENSE_TEXT) -> None:
    """Configure mocks for a successful pdfplumber extraction (non-sparse path).

    Patches _extract_with_pdfplumber and _extract_with_tesseract directly on
    the lambda module to avoid fragile pdfplumber context-manager mock chains.
    """
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = _s3_404()
    _mock_s3.get_object.side_effect = None

    metadata = {"ext": ".pdf", "status": "uploaded"}
    raw_bytes = b"%PDF-fake"

    call_count = {"n": 0}

    def _get_object(Bucket, Key):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return {"Body": _make_body(metadata)}
        return {"Body": MagicMock(read=lambda: raw_bytes)}

    _mock_s3.get_object.side_effect = _get_object

    # Patch extraction functions directly — avoids pdfplumber CM complexity.
    lf._extract_with_pdfplumber = lambda raw: (text, False)
    lf._extract_with_tesseract = lambda raw: text


# ── 1. Input validation ───────────────────────────────────────────────────────


def test_missing_md5_returns_400():
    assert _call({})["statusCode"] == 400


def test_empty_md5_returns_400():
    assert _call({"md5": ""})["statusCode"] == 400


def test_whitespace_md5_returns_400():
    assert _call({"md5": "   "})["statusCode"] == 400


def test_missing_md5_body_has_message():
    body = _call({})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "message" in parsed


# ── 2. Idempotency ────────────────────────────────────────────────────────────


def test_already_extracted_returns_200():
    _mock_s3.reset_mock()
    _mock_s3.head_object.return_value = {}  # text.txt exists
    assert _call({"md5": "abc123"})["statusCode"] == 200


def test_already_extracted_body_has_skipped_true():
    _mock_s3.reset_mock()
    _mock_s3.head_object.return_value = {}
    body = _call({"md5": "abc123"})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("skipped") is True


def test_already_extracted_body_has_status_ready():
    _mock_s3.reset_mock()
    _mock_s3.head_object.return_value = {}
    body = _call({"md5": "abc123"})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("status") == "ready"


# ── 3. Document not found ─────────────────────────────────────────────────────


def test_missing_document_returns_404():
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = _s3_404()
    _mock_s3.get_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "Not Found"}}, "GetObject"
    )
    assert _call({"md5": "deadbeef12345678deadbeef12345678"})["statusCode"] == 404


# ── 4. Successful extraction ──────────────────────────────────────────────────


def test_success_returns_200():
    _setup_happy_path("Course content about Python programming.")
    assert _call({"md5": "a" * 32})["statusCode"] == 200


def test_success_body_has_char_count():
    text = "Course content about Python programming."
    _setup_happy_path(text)
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "char_count" in parsed


def test_success_body_has_status_ready():
    _setup_happy_path("Some extracted text content.")
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("status") == "ready"


def test_success_body_has_md5():
    _setup_happy_path("Some extracted text content.")
    md5 = "a" * 32
    body = _call({"md5": md5})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("md5") == md5


def test_success_writes_text_to_s3():
    _setup_happy_path("Extracted content here.")
    _call({"md5": "a" * 32})
    assert _mock_s3.put_object.called


def test_success_body_not_skipped():
    _setup_happy_path("Extracted content here.")
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("skipped") is not True


# ── 5. JSON body envelope ─────────────────────────────────────────────────────


def test_accepts_json_body_envelope():
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = None
    _mock_s3.head_object.return_value = {}
    event = {"body": json.dumps({"md5": "abc123"})}
    assert _call(event)["statusCode"] == 200


def test_invalid_json_body_returns_400():
    assert _call({"body": "not-json"})["statusCode"] == 400
