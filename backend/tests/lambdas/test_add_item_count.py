#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""Test suite for esm-live-add-item-count Lambda.

Covers:
  1. Input validation  – missing / empty required fields, wrong type for count
  2. Success path      – valid input writes correct record to S3 and returns 200
  3. S3 failure        – boto3 exception is caught and returns 500

S3 is mocked at module import time so no real AWS calls occur.

Run with:
    cd tests && poetry run pytest lambdas/test_add_item_count.py -v --noconftest
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# ── Path setup ────────────────────────────────────────────────────────────────

LAMBDA_DIR = (
    Path(__file__).parent.parent.parent
    / "lambdas"
    / "esm-live-add-item-count"
)

_mock_s3 = MagicMock()

sys.path.insert(0, str(LAMBDA_DIR))
with patch("boto3.client", return_value=_mock_s3):
    import lambda_function as lf


# ── Fixtures ──────────────────────────────────────────────────────────────────


def _valid_event() -> dict:
    return {
        "slug": "intro-to-python",
        "count": 1,
        "ip_address": "203.0.113.42",
        "count_type": "view",
    }


def _call(event: dict) -> dict:
    _mock_s3.reset_mock()
    return lf.handler(event, None)


# ── 1. Input validation ───────────────────────────────────────────────────────


def test_missing_slug_returns_error():
    ev = _valid_event()
    del ev["slug"]
    result = _call(ev)
    assert result["statusCode"] != 200


def test_empty_slug_returns_error():
    ev = _valid_event()
    ev["slug"] = "   "
    result = _call(ev)
    assert result["statusCode"] != 200


def test_missing_count_type_returns_error():
    ev = _valid_event()
    del ev["count_type"]
    result = _call(ev)
    assert result["statusCode"] != 200


def test_empty_count_type_returns_error():
    ev = _valid_event()
    ev["count_type"] = ""
    result = _call(ev)
    assert result["statusCode"] != 200


def test_missing_ip_address_returns_error():
    ev = _valid_event()
    del ev["ip_address"]
    result = _call(ev)
    assert result["statusCode"] != 200


def test_empty_ip_address_returns_error():
    ev = _valid_event()
    ev["ip_address"] = "   "
    result = _call(ev)
    assert result["statusCode"] != 200


def test_missing_count_returns_error():
    ev = _valid_event()
    del ev["count"]
    result = _call(ev)
    assert result["statusCode"] != 200


def test_count_as_string_returns_error():
    ev = _valid_event()
    ev["count"] = "1"
    result = _call(ev)
    assert result["statusCode"] != 200


def test_count_as_float_returns_error():
    ev = _valid_event()
    ev["count"] = 1.5
    result = _call(ev)
    assert result["statusCode"] != 200


def test_count_as_none_returns_error():
    ev = _valid_event()
    ev["count"] = None
    result = _call(ev)
    assert result["statusCode"] != 200


# ── 2. Success path ───────────────────────────────────────────────────────────


def test_valid_event_returns_200():
    result = _call(_valid_event())
    assert result["statusCode"] == 200


def test_valid_event_body_is_none():
    result = _call(_valid_event())
    assert result["body"] is None


def test_valid_event_calls_s3_put_object():
    _call(_valid_event())
    _mock_s3.put_object.assert_called_once()


def test_s3_key_contains_count_type():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert "view" in call_kwargs["Key"]


def test_s3_key_contains_slug():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert "intro-to-python" in call_kwargs["Key"]


def test_s3_key_starts_with_eduskillsmp():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Key"].startswith("eduskillsmp/")


def test_s3_key_ends_with_json():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Key"].endswith(".json")


def test_s3_record_contains_count():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    record = json.loads(call_kwargs["Body"])
    assert record["count"] == 1


def test_s3_record_contains_ip_address():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    record = json.loads(call_kwargs["Body"])
    assert record["ip-address"] == "203.0.113.42"


def test_s3_record_contains_ts():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    record = json.loads(call_kwargs["Body"])
    assert "ts" in record


def test_s3_record_count_is_int():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    record = json.loads(call_kwargs["Body"])
    assert isinstance(record["count"], int)


def test_s3_bucket_is_mskillsiq():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Bucket"] == "mskillsiq"


def test_count_zero_is_valid():
    ev = _valid_event()
    ev["count"] = 0
    result = _call(ev)
    assert result["statusCode"] == 200


def test_count_large_value_is_valid():
    ev = _valid_event()
    ev["count"] = 999999
    result = _call(ev)
    assert result["statusCode"] == 200


def test_different_count_type_click():
    ev = _valid_event()
    ev["count_type"] = "click"
    result = _call(ev)
    assert result["statusCode"] == 200
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    assert "click" in call_kwargs["Key"]


# ── 3. S3 failure ─────────────────────────────────────────────────────────────


def test_s3_exception_returns_500():
    _mock_s3.put_object.side_effect = Exception("network error")
    result = _call(_valid_event())
    assert result["statusCode"] == 500
    _mock_s3.put_object.side_effect = None  # reset for subsequent tests


def test_s3_exception_body_has_message():
    _mock_s3.put_object.side_effect = Exception("timeout")
    result = _call(_valid_event())
    assert "message" in result["body"]
    _mock_s3.put_object.side_effect = None


# ── 4. user_id field ──────────────────────────────────────────────────────────


def test_user_id_present_in_record():
    ev = {**_valid_event(), "user_id": "u-abc123"}
    _call(ev)
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    record = json.loads(call_kwargs["Body"])
    assert record["user-id"] == "u-abc123"


def test_user_id_absent_stored_as_null():
    _call(_valid_event())
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    record = json.loads(call_kwargs["Body"])
    assert record["user-id"] is None


def test_user_id_empty_string_stored_as_null():
    ev = {**_valid_event(), "user_id": "   "}
    _call(ev)
    call_kwargs = _mock_s3.put_object.call_args.kwargs
    record = json.loads(call_kwargs["Body"])
    assert record["user-id"] is None


def test_user_id_does_not_affect_status_code():
    ev = {**_valid_event(), "user_id": "u-xyz"}
    result = _call(ev)
    assert result["statusCode"] == 200
