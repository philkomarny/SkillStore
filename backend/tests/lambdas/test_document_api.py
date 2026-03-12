#!/usr/bin/env python
"""Comprehensive API tests for the four document management endpoints.

Covers positive and negative cases for:
  POST   /esm_live_upload_document_post    — upload
  GET    /esm_live_get_document_get        — fetch metadata + text
  GET    /esm_live_list_documents_get      — list user's library
  DELETE /esm_live_delete_document_delete  — remove from library

All calls hit real deployed API Gateways. No mocks.

Related:
    https://github.com/philkomarny/SkillStore/issues/28
    https://github.com/philkomarny/SkillStore/issues/14

Run with:
    cd tests && AWS_PROFILE=transcriptiq_lambdaserviceuser poetry run pytest \
        lambdas/test_document_api.py -v -s --noconftest
"""

from __future__ import annotations

import base64
import hashlib
import time

import requests

# ── API Gateway URLs (SkillStore#28) ──────────────────────────────────

_URL_UPLOAD = "https://plvh12o05c.execute-api.us-west-2.amazonaws.com/prod/esm_live_upload_document_post"
_URL_GET    = "https://ikt0pbkcx1.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_document_get"
_URL_LIST   = "https://durik7cyze.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_documents_get"
_URL_DELETE = "https://l9h3c7vji5.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_document_delete"

_TEST_USER = "999000000000000000001"  # https://github.com/philkomarny/SkillStore/issues/27

# An MD5-shaped hex string guaranteed to have no document in the store.
_FAKE_MD5 = "a" * 32

# ── Helpers ────────────────────────────────────────────────────────────────────


def _post(url: str, payload: dict) -> dict:
    resp = requests.post(url, json=payload, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _get(url: str, params: dict) -> dict:
    resp = requests.get(url, params=params, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _delete(md5: str, user_id: str = _TEST_USER) -> int:
    """DELETE the document and return HTTP status code."""
    resp = requests.delete(_URL_DELETE, params={"md5": md5, "user_id": user_id}, timeout=60)
    return resp.status_code


def _upload_txt(content: str, filename: str = "test.txt", user_id: str = _TEST_USER) -> dict:
    raw = content.encode("utf-8")
    return _post(_URL_UPLOAD, {
        "filename": filename,
        "user_id": user_id,
        "file_content": base64.b64encode(raw).decode(),
    })


def _md5_of(content: str) -> str:
    return hashlib.md5(content.encode("utf-8")).hexdigest()


def _poll_until_ready(md5: str, timeout_s: int = 120, interval_s: int = 5) -> dict:
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        result = _get(_URL_GET, {"md5": md5})
        assert result["statusCode"] == 200, f"get-document error: {result}"
        if result["body"].get("status") != "processing":
            return result["body"]
        time.sleep(interval_s)
    raise AssertionError(f"Document {md5} still 'processing' after {timeout_s}s")


# ── Upload: validation errors ──────────────────────────────────────────────────


def test_upload_missing_file_content():
    result = _post(_URL_UPLOAD, {"filename": "test.txt", "user_id": _TEST_USER})
    assert result["statusCode"] == 400
    assert "file_content" in result["body"].get("message", "")


def test_upload_missing_filename():
    result = _post(_URL_UPLOAD, {
        "user_id": _TEST_USER,
        "file_content": base64.b64encode(b"data").decode(),
    })
    assert result["statusCode"] == 400
    assert "filename" in result["body"].get("message", "")


def test_upload_missing_user_id():
    result = _post(_URL_UPLOAD, {
        "filename": "test.txt",
        "file_content": base64.b64encode(b"data").decode(),
    })
    assert result["statusCode"] == 400


def test_upload_non_numeric_user_id():
    """Google sub IDs are numeric strings; alphabetic values must be rejected."""
    result = _post(_URL_UPLOAD, {
        "filename": "test.txt",
        "user_id": "not-a-google-sub",
        "file_content": base64.b64encode(b"data").decode(),
    })
    assert result["statusCode"] == 400
    assert "user_id" in result["body"].get("message", "")


def test_upload_sentinel_user_id():
    """Sentinel strings like 'null', 'undefined' must be rejected."""
    for sentinel in ("null", "undefined", "none", "anonymous"):
        result = _post(_URL_UPLOAD, {
            "filename": "test.txt",
            "user_id": sentinel,
            "file_content": base64.b64encode(b"data").decode(),
        })
        assert result["statusCode"] == 400, f"Expected 400 for sentinel user_id='{sentinel}'"


def test_upload_unsupported_extension():
    result = _post(_URL_UPLOAD, {
        "filename": "test.exe",
        "user_id": _TEST_USER,
        "file_content": base64.b64encode(b"data").decode(),
    })
    assert result["statusCode"] == 415


def test_upload_invalid_base64():
    result = _post(_URL_UPLOAD, {
        "filename": "test.txt",
        "user_id": _TEST_USER,
        "file_content": "!!!not-valid-base64!!!",
    })
    assert result["statusCode"] == 400


# ── Upload: lifecycle ──────────────────────────────────────────────────────────


def test_upload_new_document_returns_201():
    """First upload of a unique file returns 201 + existed=False."""
    content = f"new-doc-test-{time.monotonic()}"
    md5 = _md5_of(content)
    _delete(md5)  # ensure clean state

    result = _upload_txt(content)
    assert result["statusCode"] == 201, f"Expected 201: {result}"
    assert result["body"]["md5"] == md5
    assert result["body"]["existed"] is False
    assert result["body"]["status"] == "processing"

    _delete(md5)


def test_upload_idempotent_returns_200_existed_true():
    """Uploading the same file twice returns 200 + existed=True on the second call."""
    content = "idempotency-check-unique-content-abc123"
    md5 = _md5_of(content)
    _delete(md5)

    first = _upload_txt(content, filename="idem-test.txt")
    assert first["statusCode"] in (200, 201)

    second = _upload_txt(content, filename="idem-test.txt")
    assert second["statusCode"] == 200, f"Expected 200 on duplicate: {second}"
    assert second["body"]["existed"] is True
    assert second["body"]["md5"] == md5

    _delete(md5)


def test_upload_idempotent_different_users():
    """Two different users uploading the same file: both should get existed=True after first."""
    second_user = "888000000000000000002"
    content = "shared-content-different-users-xyz789"
    md5 = _md5_of(content)
    _delete(md5, user_id=_TEST_USER)
    _delete(md5, user_id=second_user)

    first = _upload_txt(content, filename="shared.txt", user_id=_TEST_USER)
    assert first["statusCode"] in (200, 201)

    second = _upload_txt(content, filename="shared.txt", user_id=second_user)
    assert second["statusCode"] == 200
    assert second["body"]["existed"] is True

    _delete(md5, user_id=_TEST_USER)
    _delete(md5, user_id=second_user)


# ── Get document: validation and error paths ───────────────────────────────────


def test_get_document_missing_md5():
    result = _get(_URL_GET, {})
    assert result["statusCode"] == 400


def test_get_document_not_found():
    result = _get(_URL_GET, {"md5": _FAKE_MD5})
    assert result["statusCode"] == 404


def test_get_document_user_not_in_library():
    """GET with user_id for a doc the user does not own returns 404."""
    result = _get(_URL_GET, {"md5": _FAKE_MD5, "user_id": _TEST_USER})
    assert result["statusCode"] == 404


def test_get_document_response_fields():
    """Upload a .txt, wait for ready, verify every documented response field."""
    content = f"field-check-{time.monotonic()}"
    md5 = _md5_of(content)
    _delete(md5)

    _upload_txt(content, filename="field-check.txt")
    body = _poll_until_ready(md5)

    assert body["status"] == "ready"
    assert body["md5"] == md5
    assert body["filename"] == "field-check.txt"
    assert body["mime_type"]
    assert body["size_bytes"] > 0
    assert body["created_at"]
    assert body.get("text"), "text field should be populated when status=ready"

    _delete(md5)


# ── List documents ─────────────────────────────────────────────────────────────


def test_list_documents_missing_user_id():
    result = _get(_URL_LIST, {})
    assert result["statusCode"] == 400


def test_list_documents_unknown_user_returns_empty_list():
    """A user who has never uploaded anything returns an empty documents list."""
    result = _get(_URL_LIST, {"user_id": "100000000000000000001"})
    assert result["statusCode"] == 200
    docs = result["body"].get("documents")
    assert isinstance(docs, list)
    assert docs == []


def test_list_documents_contains_uploaded_doc():
    """Upload a doc, list the user's library, confirm the md5 is present."""
    content = f"list-inclusion-test-{time.monotonic()}"
    md5 = _md5_of(content)
    _delete(md5)

    _upload_txt(content, filename="list-me.txt")

    result = _get(_URL_LIST, {"user_id": _TEST_USER})
    assert result["statusCode"] == 200
    md5s = [d["md5"] for d in result["body"].get("documents", [])]
    assert md5 in md5s, f"Uploaded md5={md5} not found in list: {md5s}"

    _delete(md5)


def test_list_documents_entry_has_expected_fields():
    """Each entry in the list must have md5, filename, added_at, status."""
    content = f"list-fields-test-{time.monotonic()}"
    md5 = _md5_of(content)
    _delete(md5)

    _upload_txt(content, filename="list-fields.txt")

    result = _get(_URL_LIST, {"user_id": _TEST_USER})
    assert result["statusCode"] == 200
    docs = result["body"].get("documents", [])
    entry = next((d for d in docs if d["md5"] == md5), None)
    assert entry is not None, f"md5={md5} not found in list"
    assert entry["filename"] == "list-fields.txt"
    assert entry["added_at"]
    assert entry["status"] in ("processing", "ready", "error")

    _delete(md5)


def test_list_documents_sorted_newest_first():
    """List returns documents sorted newest-first (added_at descending)."""
    content_a = f"sort-test-a-{time.monotonic()}"
    content_b = f"sort-test-b-{time.monotonic() + 0.001}"
    md5_a = _md5_of(content_a)
    md5_b = _md5_of(content_b)
    _delete(md5_a)
    _delete(md5_b)

    _upload_txt(content_a, filename="sort-a.txt")
    time.sleep(1)  # ensure distinct added_at timestamps
    _upload_txt(content_b, filename="sort-b.txt")

    result = _get(_URL_LIST, {"user_id": _TEST_USER})
    assert result["statusCode"] == 200
    docs = result["body"].get("documents", [])
    md5s = [d["md5"] for d in docs]
    idx_a = md5s.index(md5_a) if md5_a in md5s else -1
    idx_b = md5s.index(md5_b) if md5_b in md5s else -1
    assert idx_b != -1 and idx_a != -1, "Both docs must appear in the list"
    assert idx_b < idx_a, f"Newer doc (b) should appear before older doc (a); got idx_b={idx_b}, idx_a={idx_a}"

    _delete(md5_a)
    _delete(md5_b)


# ── Delete document ────────────────────────────────────────────────────────────


def test_delete_document_not_found():
    status = _delete(_FAKE_MD5)
    assert status == 404


def test_delete_document_missing_md5():
    resp = requests.delete(_URL_DELETE, params={"user_id": _TEST_USER}, timeout=60)
    assert resp.status_code == 400


def test_delete_document_missing_user_id():
    resp = requests.delete(_URL_DELETE, params={"md5": _FAKE_MD5}, timeout=60)
    assert resp.status_code == 400


def test_delete_document_removes_from_list():
    """Upload → verify in list → delete → verify absent from list."""
    content = f"delete-list-test-{time.monotonic()}"
    md5 = _md5_of(content)
    _delete(md5)

    _upload_txt(content, filename="delete-me.txt")

    before = _get(_URL_LIST, {"user_id": _TEST_USER})
    md5s_before = [d["md5"] for d in before["body"].get("documents", [])]
    assert md5 in md5s_before, f"md5={md5} should be in list before delete"

    assert _delete(md5) == 200

    after = _get(_URL_LIST, {"user_id": _TEST_USER})
    md5s_after = [d["md5"] for d in after["body"].get("documents", [])]
    assert md5 not in md5s_after, f"md5={md5} should be absent after delete"


def test_delete_preserves_global_store_record():
    """Delete removes the user's library ref only; global store record stays intact.

    Architectural invariant: other users may reference the same document
    (content-addressable store), so the raw file and metadata are never deleted.
    A GET without user_id checks only the global store and must still return 200.
    A GET with user_id checks the library first and must return 404 post-delete.
    """
    content = f"global-store-test-{time.monotonic()}"
    md5 = _md5_of(content)
    _delete(md5)

    _upload_txt(content, filename="preserve-test.txt")
    _poll_until_ready(md5)

    # Delete from user's library
    assert _delete(md5) == 200

    # Global store record still accessible
    result_global = _get(_URL_GET, {"md5": md5})
    assert result_global["statusCode"] == 200, (
        "Global store record must survive library deletion"
    )

    # But the user's library no longer contains it
    result_user = _get(_URL_GET, {"md5": md5, "user_id": _TEST_USER})
    assert result_user["statusCode"] == 404, (
        "GET with user_id should 404 after document removed from their library"
    )


def test_delete_twice_returns_404_on_second():
    """Deleting the same document twice: first returns 200, second returns 404."""
    content = f"double-delete-test-{time.monotonic()}"
    md5 = _md5_of(content)
    _delete(md5)

    _upload_txt(content, filename="double-delete.txt")

    assert _delete(md5) == 200
    assert _delete(md5) == 404
