#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""Test suite for esm-live-get-google-auth Lambda.

Covers:
  1. Input validation  – missing / empty user_id
  2. Found             – record exists, returns 200 with full profile
  3. Not found         – NoSuchKey → 404
  4. S3 failure        – unexpected ClientError / generic exception → 500

S3 is mocked at module import time so no real AWS calls occur.

Run with:
    cd tests && poetry run pytest lambdas/test_get_google_auth.py -v --noconftest
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from unittest.mock import MagicMock, patch

from botocore.exceptions import ClientError

LAMBDA_DIR = (
    Path(__file__).parent.parent.parent
    / "lambdas"
    / "esm-live-get-google-auth"
)

_mock_s3 = MagicMock()

_spec = importlib.util.spec_from_file_location("lf_get_google_auth", LAMBDA_DIR / "lambda_function.py")
_mod = importlib.util.module_from_spec(_spec)
with patch("boto3.client", return_value=_mock_s3):
    _spec.loader.exec_module(_mod)
lf = _mod


# ── Helpers ───────────────────────────────────────────────────────────────────

_SAMPLE_RECORD = {
    "user-id": "108312345678901234567",
    "user-name": "Jane Doe",
    "user-email": "jane@example.com",
    "user-image-url": "https://lh3.googleusercontent.com/photo.jpg",
    "ts": "2026-03-05T14:00:00+00:00",
}


def _make_body(record: dict) -> MagicMock:
    body = MagicMock()
    body.read.return_value = json.dumps(record).encode()
    return body


def _setup_found(record: dict = _SAMPLE_RECORD) -> None:
    _mock_s3.reset_mock()
    _mock_s3.get_object.return_value = {"Body": _make_body(record)}
    _mock_s3.get_object.side_effect = None


def _setup_not_found() -> None:
    _mock_s3.reset_mock()
    error_response = {"Error": {"Code": "NoSuchKey", "Message": "The specified key does not exist."}}
    _mock_s3.get_object.side_effect = ClientError(error_response, "GetObject")


def _call(event: dict) -> dict:
    return lf.handler(event, None)


def _valid_event() -> dict:
    return {"user_id": "108312345678901234567"}


# ── 1. Input validation ───────────────────────────────────────────────────────


def test_missing_user_id_returns_error():
    assert _call({})["statusCode"] != 200


def test_empty_user_id_returns_error():
    assert _call({"user_id": "   "})["statusCode"] != 200


def test_query_string_parameters_supported():
    _setup_found()
    result = _call({"queryStringParameters": {"user_id": "108312345678901234567"}})
    assert result["statusCode"] == 200


# ── 2. Found ──────────────────────────────────────────────────────────────────


def test_found_returns_200():
    _setup_found()
    assert _call(_valid_event())["statusCode"] == 200


def test_found_body_contains_user_id():
    _setup_found()
    assert _call(_valid_event())["body"]["user-id"] == "108312345678901234567"


def test_found_body_contains_user_name():
    _setup_found()
    assert _call(_valid_event())["body"]["user-name"] == "Jane Doe"


def test_found_body_contains_user_email():
    _setup_found()
    assert _call(_valid_event())["body"]["user-email"] == "jane@example.com"


def test_found_body_contains_user_image_url():
    _setup_found()
    assert _call(_valid_event())["body"]["user-image-url"] == "https://lh3.googleusercontent.com/photo.jpg"


def test_found_body_contains_ts():
    _setup_found()
    assert "ts" in _call(_valid_event())["body"]


# ── 3. Not found ──────────────────────────────────────────────────────────────


def test_not_found_returns_404():
    _setup_not_found()
    assert _call(_valid_event())["statusCode"] == 404


def test_not_found_body_has_message():
    _setup_not_found()
    assert "message" in _call(_valid_event())["body"]


def test_not_found_message_contains_user_id():
    _setup_not_found()
    body = _call(_valid_event())["body"]
    assert "108312345678901234567" in body["message"]


# ── 4. S3 failure ─────────────────────────────────────────────────────────────


def test_s3_unexpected_client_error_returns_500():
    _mock_s3.reset_mock()
    error_response = {"Error": {"Code": "InternalError", "Message": "Internal server error"}}
    _mock_s3.get_object.side_effect = ClientError(error_response, "GetObject")
    assert _call(_valid_event())["statusCode"] == 500
    _mock_s3.get_object.side_effect = None


def test_s3_generic_exception_returns_500():
    _mock_s3.reset_mock()
    _mock_s3.get_object.side_effect = Exception("network error")
    assert _call(_valid_event())["statusCode"] == 500
    _mock_s3.get_object.side_effect = None


def test_s3_failure_body_has_message():
    _mock_s3.reset_mock()
    _mock_s3.get_object.side_effect = Exception("timeout")
    result = _call(_valid_event())
    assert "message" in result["body"]
    _mock_s3.get_object.side_effect = None
