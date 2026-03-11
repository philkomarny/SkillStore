#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""Test suite for esm-live-add-google-auth Lambda.

Covers:
  1. Input validation  – missing / empty required fields
  2. Success path      – valid input writes correct record to S3 and returns 200
  3. S3 failure        – boto3 exception is caught and returns 500

S3 is mocked at module import time so no real AWS calls occur.

Run with:
    cd tests && poetry run pytest lambdas/test_add_google_auth.py -v --noconftest
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from unittest.mock import MagicMock, patch

LAMBDA_DIR = (
    Path(__file__).parent.parent.parent
    / "lambdas"
    / "esm-live-add-google-auth"
)

_mock_s3 = MagicMock()

_spec = importlib.util.spec_from_file_location("lf_add_google_auth", LAMBDA_DIR / "lambda_function.py")
_mod = importlib.util.module_from_spec(_spec)
with patch("boto3.client", return_value=_mock_s3):
    _spec.loader.exec_module(_mod)
lf = _mod


# ── Helpers ───────────────────────────────────────────────────────────────────


def _valid_event() -> dict:
    return {
        "user_id": "108312345678901234567",
        "user_name": "Jane Doe",
        "user_email": "jane@example.com",
        "user_image_url": "https://lh3.googleusercontent.com/photo.jpg",
    }


def _call(event: dict) -> dict:
    _mock_s3.reset_mock()
    return lf.handler(event, None)


# ── 1. Input validation ───────────────────────────────────────────────────────


def test_missing_user_id_returns_error():
    ev = _valid_event()
    del ev["user_id"]
    assert _call(ev)["statusCode"] != 200


def test_empty_user_id_returns_error():
    assert _call({**_valid_event(), "user_id": "   "})["statusCode"] != 200


def test_missing_user_name_returns_error():
    ev = _valid_event()
    del ev["user_name"]
    assert _call(ev)["statusCode"] != 200


def test_empty_user_name_returns_error():
    assert _call({**_valid_event(), "user_name": ""})["statusCode"] != 200


def test_missing_user_email_returns_error():
    ev = _valid_event()
    del ev["user_email"]
    assert _call(ev)["statusCode"] != 200


def test_empty_user_email_returns_error():
    assert _call({**_valid_event(), "user_email": "   "})["statusCode"] != 200


def test_missing_user_image_url_returns_error():
    ev = _valid_event()
    del ev["user_image_url"]
    assert _call(ev)["statusCode"] != 200


def test_empty_user_image_url_returns_error():
    assert _call({**_valid_event(), "user_image_url": ""})["statusCode"] != 200


# ── 2. Success path ───────────────────────────────────────────────────────────


def test_valid_event_returns_200():
    assert _call(_valid_event())["statusCode"] == 200


def test_valid_event_body_is_none():
    assert _call(_valid_event())["body"] is None


def test_valid_event_calls_s3_put_object():
    _call(_valid_event())
    _mock_s3.put_object.assert_called_once()


def test_s3_key_contains_user_id():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert "108312345678901234567" in call_kwargs["Key"]


def test_s3_key_starts_with_eduskillsmp_auth():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Key"].startswith("eduskillsmp/auth/")


def test_s3_key_ends_with_json():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Key"].endswith(".json")


def test_s3_key_is_fixed_per_user():
    """Same user_id always maps to the same key (upsert, not append)."""
    _call(_valid_event())
    key1 = _mock_s3.put_object.call_args.kwargs["Key"]
    _call(_valid_event())
    key2 = _mock_s3.put_object.call_args.kwargs["Key"]
    assert key1 == key2


def test_s3_bucket_is_mskillsiq():
    _call(_valid_event())
    assert _mock_s3.put_object.call_args.kwargs["Bucket"] == "mskillsiq"


def test_record_contains_user_id():
    _call(_valid_event())
    record = json.loads(_mock_s3.put_object.call_args.kwargs["Body"])
    assert record["user-id"] == "108312345678901234567"


def test_record_contains_user_name():
    _call(_valid_event())
    record = json.loads(_mock_s3.put_object.call_args.kwargs["Body"])
    assert record["user-name"] == "Jane Doe"


def test_record_contains_user_email():
    _call(_valid_event())
    record = json.loads(_mock_s3.put_object.call_args.kwargs["Body"])
    assert record["user-email"] == "jane@example.com"


def test_record_contains_user_image_url():
    _call(_valid_event())
    record = json.loads(_mock_s3.put_object.call_args.kwargs["Body"])
    assert record["user-image-url"] == "https://lh3.googleusercontent.com/photo.jpg"


def test_record_contains_ts():
    _call(_valid_event())
    record = json.loads(_mock_s3.put_object.call_args.kwargs["Body"])
    assert "ts" in record


# ── 3. S3 failure ─────────────────────────────────────────────────────────────


def test_s3_exception_returns_500():
    _mock_s3.put_object.side_effect = Exception("network error")
    result = _call(_valid_event())
    assert result["statusCode"] == 500
    _mock_s3.put_object.side_effect = None


def test_s3_exception_body_has_message():
    _mock_s3.put_object.side_effect = Exception("timeout")
    result = _call(_valid_event())
    assert "message" in result["body"]
    _mock_s3.put_object.side_effect = None
