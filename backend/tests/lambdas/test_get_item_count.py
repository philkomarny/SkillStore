#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""Test suite for esm-live-get-item-count Lambda.

Covers:
  1. Input validation       – missing / empty slug and count_type
  2. Zero records           – prefix returns no keys → body: {"total": 0}
  3. Non-verbose (default)  – body contains only total
  4. Verbose mode           – body contains total + records as tuples
  5. S3 list failure        – list_objects_v2 raises → 500
  6. Partial read failure   – one file unreadable, rest still summed

S3 is mocked at module import time so no real AWS calls occur.

Run with:
    cd tests && poetry run pytest lambdas/test_get_item_count.py -v --noconftest
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# ── Path setup ────────────────────────────────────────────────────────────────

LAMBDA_DIR = (
    Path(__file__).parent.parent.parent
    / "lambdas"
    / "esm-live-get-item-count"
)

_mock_s3 = MagicMock()

# Load by file path to avoid colliding with same-named module from other Lambda tests
_spec = importlib.util.spec_from_file_location("lf_get_item_count", LAMBDA_DIR / "lambda_function.py")
_mod = importlib.util.module_from_spec(_spec)
with patch("boto3.client", return_value=_mock_s3):
    _spec.loader.exec_module(_mod)
lf = _mod


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_page(keys: list[str]) -> dict:
    return {"Contents": [{"Key": k} for k in keys]}


def _make_body(count: int, ip: str = "1.2.3.4", ts: str = "2026-03-05T00:00:00+00:00", user_id: str | None = None) -> MagicMock:
    body = MagicMock()
    body.read.return_value = json.dumps({
        "count": count,
        "ip-address": ip,
        "ts": ts,
        "user-id": user_id,
    }).encode()
    return body


def _setup_s3(keys: list[str], records: list[dict]) -> None:
    """Configure mock paginator and per-key get_object responses."""
    _mock_s3.reset_mock()
    paginator = MagicMock()
    paginator.paginate.return_value = [_make_page(keys)]
    _mock_s3.get_paginator.return_value = paginator

    key_to_record = dict(zip(keys, records))

    def _get_object(Bucket, Key):
        if Key not in key_to_record:
            raise Exception(f"Key not found: {Key}")
        r = key_to_record[Key]
        return {"Body": _make_body(r["count"], r.get("ip", "1.2.3.4"), r.get("ts", "2026-03-05T00:00:00+00:00"), r.get("user_id"))}

    _mock_s3.get_object.side_effect = _get_object


def _call(event: dict) -> dict:
    return lf.handler(event, None)


def _valid_event(verbose: str | None = None) -> dict:
    ev = {"slug": "intro-to-python", "count_type": "view"}
    if verbose is not None:
        ev["verbose"] = verbose
    return ev


# ── 1. Input validation ───────────────────────────────────────────────────────


def test_missing_slug_returns_error():
    ev = _valid_event()
    del ev["slug"]
    assert _call(ev)["statusCode"] != 200


def test_empty_slug_returns_error():
    assert _call({**_valid_event(), "slug": "   "})["statusCode"] != 200


def test_missing_count_type_returns_error():
    ev = _valid_event()
    del ev["count_type"]
    assert _call(ev)["statusCode"] != 200


def test_empty_count_type_returns_error():
    assert _call({**_valid_event(), "count_type": ""})["statusCode"] != 200


# ── 2. Zero records ───────────────────────────────────────────────────────────


def test_no_records_returns_200():
    _setup_s3([], [])
    assert _call(_valid_event())["statusCode"] == 200


def test_no_records_total_is_zero():
    _setup_s3([], [])
    assert _call(_valid_event())["body"]["total"] == 0


def test_no_records_no_records_key_in_default_mode():
    _setup_s3([], [])
    assert "records" not in _call(_valid_event())["body"]


# ── 3. Non-verbose (default) ──────────────────────────────────────────────────


def test_default_body_has_total():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 5}])
    assert "total" in _call(_valid_event())["body"]


def test_default_body_no_records_key():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 5}])
    assert "records" not in _call(_valid_event())["body"]


def test_default_total_correct():
    keys = [
        "eduskillsmp/view/intro-to-python/20260305/a.json",
        "eduskillsmp/view/intro-to-python/20260305/b.json",
    ]
    _setup_s3(keys, [{"count": 3}, {"count": 7}])
    assert _call(_valid_event())["body"]["total"] == 10


def test_verbose_false_same_as_default():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 4}])
    assert "records" not in _call(_valid_event(verbose="false"))["body"]


# ── 4. Verbose mode ───────────────────────────────────────────────────────────


def test_verbose_true_body_has_records():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 1}])
    assert "records" in _call(_valid_event(verbose="true"))["body"]


def test_verbose_true_body_has_total():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 1}])
    assert "total" in _call(_valid_event(verbose="true"))["body"]


def test_verbose_records_is_list():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 1}])
    assert isinstance(_call(_valid_event(verbose="true"))["body"]["records"], list)


def test_verbose_record_has_four_elements():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 1, "ip": "10.0.0.1", "ts": "2026-03-05T00:00:00+00:00", "user_id": None}])
    records = _call(_valid_event(verbose="true"))["body"]["records"]
    assert len(records[0]) == 4


def test_verbose_record_position_0_is_count():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 7, "ip": "10.0.0.1"}])
    records = _call(_valid_event(verbose="true"))["body"]["records"]
    assert records[0][0] == 7


def test_verbose_record_position_1_is_ip():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 1, "ip": "10.0.0.1"}])
    records = _call(_valid_event(verbose="true"))["body"]["records"]
    assert records[0][1] == "10.0.0.1"


def test_verbose_record_position_3_is_user_id():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 1, "user_id": "u-abc"}])
    records = _call(_valid_event(verbose="true"))["body"]["records"]
    assert records[0][3] == "u-abc"


def test_verbose_record_user_id_null_when_absent():
    _setup_s3(["eduskillsmp/view/intro-to-python/20260305/a.json"], [{"count": 1}])
    records = _call(_valid_event(verbose="true"))["body"]["records"]
    assert records[0][3] is None


def test_verbose_total_matches_sum():
    keys = [
        "eduskillsmp/view/intro-to-python/20260305/a.json",
        "eduskillsmp/view/intro-to-python/20260305/b.json",
    ]
    _setup_s3(keys, [{"count": 3}, {"count": 4}])
    body = _call(_valid_event(verbose="true"))["body"]
    assert body["total"] == 7
    assert len(body["records"]) == 2


# ── 5. S3 list failure ────────────────────────────────────────────────────────


def test_s3_list_failure_returns_500():
    _mock_s3.reset_mock()
    paginator = MagicMock()
    paginator.paginate.side_effect = Exception("S3 unavailable")
    _mock_s3.get_paginator.return_value = paginator
    assert _call(_valid_event())["statusCode"] == 500


def test_s3_list_failure_body_has_message():
    _mock_s3.reset_mock()
    paginator = MagicMock()
    paginator.paginate.side_effect = Exception("S3 unavailable")
    _mock_s3.get_paginator.return_value = paginator
    assert "message" in _call(_valid_event())["body"]


# ── 6. Partial read failure ───────────────────────────────────────────────────


def test_partial_read_failure_still_sums_valid_records():
    keys = [
        "eduskillsmp/view/intro-to-python/20260305/good.json",
        "eduskillsmp/view/intro-to-python/20260305/bad.json",
        "eduskillsmp/view/intro-to-python/20260305/also-good.json",
    ]
    _mock_s3.reset_mock()
    paginator = MagicMock()
    paginator.paginate.return_value = [_make_page(keys)]
    _mock_s3.get_paginator.return_value = paginator

    def _get_object(Bucket, Key):
        if "bad" in Key:
            raise Exception("corrupt file")
        return {"Body": _make_body(10)}

    _mock_s3.get_object.side_effect = _get_object

    body = _call(_valid_event())["body"]
    assert body["total"] == 20  # good(10) + bad(0, dropped) + also-good(10)


def test_partial_read_failure_verbose_excludes_failed_record():
    keys = [
        "eduskillsmp/view/intro-to-python/20260305/good.json",
        "eduskillsmp/view/intro-to-python/20260305/bad.json",
    ]
    _mock_s3.reset_mock()
    paginator = MagicMock()
    paginator.paginate.return_value = [_make_page(keys)]
    _mock_s3.get_paginator.return_value = paginator

    def _get_object(Bucket, Key):
        if "bad" in Key:
            raise Exception("corrupt file")
        return {"Body": _make_body(5)}

    _mock_s3.get_object.side_effect = _get_object

    body = _call(_valid_event(verbose="true"))["body"]
    assert body["total"] == 5
    assert len(body["records"]) == 1
