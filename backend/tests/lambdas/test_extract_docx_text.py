#!/usr/bin/env python
"""Tests for esm-live-extract-docx-text Lambda.

Validates mechanics: input validation, idempotency, 404 on missing doc,
unsupported extension (415), and success paths for .docx, .pptx, .txt.

All S3, python-docx, and python-pptx calls are mocked — no real AWS calls.

Run with:
    cd tests && poetry run pytest lambdas/test_extract_docx_text.py -v --noconftest
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

_docx_stub = MagicMock()
_pptx_stub = MagicMock()

sys.modules.setdefault("docx", _docx_stub)
sys.modules.setdefault("pptx", _pptx_stub)
sys.modules.setdefault("pptx.util", MagicMock())

# ── Path setup ────────────────────────────────────────────────────────────────

LAMBDA_DIR = (
    Path(__file__).parent.parent.parent
    / "lambdas"
    / "esm-live"
    / "esm-live-extract-docx-text"
)

_mock_s3 = MagicMock()

_spec = importlib.util.spec_from_file_location(
    "lf_extract_docx_text", LAMBDA_DIR / "lambda_function.py"
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


def _setup_s3_for_ext(ext: str, text_body: bytes | None = None) -> None:
    """Common S3 setup: head_object → 404, metadata → ext, original → bytes."""
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = _s3_404()

    metadata = {"ext": ext, "status": "uploaded"}
    raw_bytes = text_body or b"stub-content"

    call_count = {"n": 0}

    def _get_object(Bucket, Key):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return {"Body": _make_body(metadata)}
        return {"Body": MagicMock(read=lambda: raw_bytes)}

    _mock_s3.get_object.side_effect = _get_object


def _setup_docx(text: str = "Course content here.") -> None:
    _setup_s3_for_ext(".docx")
    para = MagicMock()
    para.text = text
    doc = MagicMock()
    doc.paragraphs = [para]
    doc.tables = []
    _docx_stub.Document.return_value = doc


def _setup_pptx(text: str = "Slide content here.") -> None:
    _setup_s3_for_ext(".pptx")
    run = MagicMock()
    run.text = text
    para = MagicMock()
    para.runs = [run]
    frame = MagicMock()
    frame.paragraphs = [para]
    shape = MagicMock()
    shape.has_text_frame = True
    shape.text_frame = frame
    slide = MagicMock()
    slide.shapes = [shape]
    prs = MagicMock()
    prs.slides = [slide]
    _pptx_stub.Presentation.return_value = prs


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
    _setup_s3_for_ext(".doc")  # .doc is not supported
    assert _call({"md5": "e" * 32})["statusCode"] == 415


def test_unsupported_ext_body_has_message():
    _setup_s3_for_ext(".xls")
    body = _call({"md5": "e" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "message" in parsed


# ── 5. DOCX extraction ────────────────────────────────────────────────────────


def test_docx_success_returns_200():
    _setup_docx("Introduction to machine learning concepts.")
    assert _call({"md5": "a" * 32})["statusCode"] == 200


def test_docx_success_body_has_char_count():
    _setup_docx("Introduction to machine learning concepts.")
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "char_count" in parsed


def test_docx_success_body_has_status_ready():
    _setup_docx("Python programming for beginners.")
    body = _call({"md5": "a" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("status") == "ready"


def test_docx_success_writes_to_s3():
    _setup_docx("Some docx content.")
    _call({"md5": "a" * 32})
    assert _mock_s3.put_object.called


# ── 6. PPTX extraction ───────────────────────────────────────────────────────


def test_pptx_success_returns_200():
    _setup_pptx("Data structures and algorithms overview.")
    assert _call({"md5": "b" * 32})["statusCode"] == 200


def test_pptx_success_body_has_char_count():
    _setup_pptx("Data structures and algorithms overview.")
    body = _call({"md5": "b" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "char_count" in parsed


def test_pptx_success_body_has_status_ready():
    _setup_pptx("Slide deck content.")
    body = _call({"md5": "b" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert parsed.get("status") == "ready"


# ── 7. Plain text / markdown extraction ──────────────────────────────────────


def test_txt_success_returns_200():
    _setup_s3_for_ext(".txt", text_body=b"Plain text course content.")
    assert _call({"md5": "c" * 32})["statusCode"] == 200


def test_md_success_returns_200():
    _setup_s3_for_ext(".md", text_body=b"# Course Overview\n\nThis course covers Python.")
    assert _call({"md5": "c" * 32})["statusCode"] == 200


def test_txt_success_body_has_char_count():
    _setup_s3_for_ext(".txt", text_body=b"Some plain text content here.")
    body = _call({"md5": "c" * 32})["body"]
    parsed = json.loads(body) if isinstance(body, str) else body
    assert "char_count" in parsed


# ── 8. JSON body envelope ─────────────────────────────────────────────────────


def test_accepts_json_body_envelope():
    _mock_s3.reset_mock()
    _mock_s3.head_object.side_effect = None
    _mock_s3.head_object.return_value = {}
    event = {"body": json.dumps({"md5": "abc123"})}
    assert _call(event)["statusCode"] == 200


def test_invalid_json_body_returns_400():
    assert _call({"body": "not-json"})["statusCode"] == 400
