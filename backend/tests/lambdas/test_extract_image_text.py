#!/usr/bin/env python
"""Tests for esm-live-extract-image-text Lambda.

Validates mechanics: input validation, idempotency, 404 on missing doc,
unsupported extension (415), OCR empty text (422), and success path.

All S3 and pytesseract calls are mocked — no real AWS calls.

Run with:
    cd tests && poetry run pytest lambdas/test_extract_image_text.py -v --noconftest
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

# ── Stub Lambda-only packages before the module loads ─────────────────────────

_pytesseract_stub = MagicMock()
_PIL_stub = MagicMock()
_PIL_Image_stub = MagicMock()
_PIL_ImageFilter_stub = MagicMock()

sys.modules.setdefault("pytesseract", _pytesseract_stub)
sys.modules.setdefault("PIL", _PIL_stub)
sys.modules.setdefault("PIL.Image", _PIL_Image_stub)
sys.modules.setdefault("PIL.ImageFilter", _PIL_ImageFilter_stub)

# ── Path setup ────────────────────────────────────────────────────────────────

LAMBDA_DIR = (
    Path(__file__).parent.parent.parent
    / "lambdas"
    / "esm-live"
    / "esm-live-extract-image-text"
)

_mock_s3 = MagicMock()

_spec = importlib.util.spec_from_file_location(
    "lf_extract_image_text", LAMBDA_DIR / "lambda_function.py"
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


def _pyt() -> MagicMock:
    """Return the pytesseract stub actually registered in sys.modules."""
    return sys.modules["pytesseract"]


def _pil_image() -> MagicMock:
    """Return the PIL.Image stub actually registered in sys.modules."""
    return sys.modules["PIL.Image"]


def _setup_happy_path(ext: str = ".jpg", ocr_text: str = "Extracted text from image.") -> None:
    """Configure mocks for a successful OCR extraction."""
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = _s3_404()
    _mock_s3.get_object.side_effect = None

    metadata = {"ext": ext, "status": "uploaded"}
    raw_bytes = b"stub-img-bytes"

    call_count = {"n": 0}

    def _get_object(Bucket, Key):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return {"Body": _make_body(metadata)}
        return {"Body": MagicMock(read=lambda: raw_bytes)}

    _mock_s3.get_object.side_effect = _get_object

    # PIL.Image: open → mock; convert + filter chain return the same mock
    img_mock = MagicMock()
    img_mock.convert.return_value = img_mock
    img_mock.filter.return_value = img_mock
    _pil_image().open.return_value = img_mock

    # pytesseract: return the test OCR text
    _pyt().image_to_string.return_value = ocr_text


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
    _mock_s3.head_object.return_value = {}
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
    assert _call({"md5": "d" * 32})["statusCode"] == 404


# ── 4. Unsupported extension ──────────────────────────────────────────────────


def test_unsupported_ext_returns_415():
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = _s3_404()
    _mock_s3.get_object.side_effect = None

    metadata = {"ext": ".gif", "status": "uploaded"}  # .gif is not supported
    _mock_s3.get_object.return_value = {"Body": _make_body(metadata)}

    assert _call({"md5": "e" * 32})["statusCode"] == 415


def test_unsupported_ext_body_has_message():
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = _s3_404()
    _mock_s3.get_object.side_effect = None
    _mock_s3.get_object.return_value = {"Body": _make_body({"ext": ".bmp", "status": "uploaded"})}

    body = _call({"md5": "e" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "message" in parsed


# ── 5. OCR produces no text ───────────────────────────────────────────────────


def test_empty_ocr_returns_422():
    _setup_happy_path(ocr_text="   ")  # whitespace only
    assert _call({"md5": "f" * 32})["statusCode"] == 422


def test_empty_ocr_body_has_message():
    _setup_happy_path(ocr_text="")
    body = _call({"md5": "f" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "message" in parsed


# ── 6. Successful OCR extraction ─────────────────────────────────────────────


def test_jpg_success_returns_200():
    _setup_happy_path(".jpg", "Learning objectives for this week.")
    assert _call({"md5": "a" * 32})["statusCode"] == 200


def test_jpeg_success_returns_200():
    _setup_happy_path(".jpeg", "Chapter summary and key terms.")
    assert _call({"md5": "a" * 32})["statusCode"] == 200


def test_png_success_returns_200():
    _setup_happy_path(".png", "Diagram description text extracted via OCR.")
    assert _call({"md5": "a" * 32})["statusCode"] == 200


def test_webp_success_returns_200():
    _setup_happy_path(".webp", "WebP image OCR result.")
    assert _call({"md5": "a" * 32})["statusCode"] == 200


def test_success_body_has_char_count():
    text = "OCR extracted text from a scanned image."
    _setup_happy_path(".jpg", text)
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "char_count" in parsed


def test_success_body_has_status_ready():
    _setup_happy_path(".jpg", "Some OCR text.")
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("status") == "ready"


def test_success_body_has_md5():
    _setup_happy_path(".jpg", "Some OCR text.")
    md5 = "a" * 32
    body = _call({"md5": md5})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("md5") == md5


def test_success_writes_text_to_s3():
    _setup_happy_path(".png", "Handwritten notes from lecture.")
    _call({"md5": "a" * 32})
    assert _mock_s3.put_object.called


def test_success_body_not_skipped():
    _setup_happy_path(".jpg", "Lecture slide text.")
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("skipped") is not True


# ── 7. JSON body envelope ─────────────────────────────────────────────────────


def test_accepts_json_body_envelope():
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = None
    _mock_s3.head_object.return_value = {}
    event = {"body": json.dumps({"md5": "abc123"})}
    assert _call(event)["statusCode"] == 200


def test_invalid_json_body_returns_400():
    assert _call({"body": "not-json"})["statusCode"] == 400
