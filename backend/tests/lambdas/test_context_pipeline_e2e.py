#!/usr/bin/env python
"""End-to-end pipeline test: upload 3 PDFs → create context → lifecycle validation.

Workflow:
    1. Pre-delete all three test documents (graceful — 404 is ok).
    2. Upload three PDFs via esm-live-upload-document-api.
    3. Poll esm-live-get-document-api for each until status leaves 'processing'.
    4. Create a context via HTTP POST to the API Gateway URL.
    5. Retrieve the context via HTTP GET and validate markdown + documents.
    6. List contexts via HTTP GET with user_id filter and confirm presence.
    7. Delete the context via HTTP DELETE (expect 204).
    8. Re-fetch the deleted context via HTTP GET and assert 404.

All phases use API Gateway HTTP endpoints (SkillStore#28).

Related:
    https://github.com/philkomarny/SkillStore/issues/24
    https://github.com/philkomarny/SkillStore/issues/18

Run with:
    cd tests && AWS_PROFILE=transcriptiq_lambdaserviceuser poetry run pytest \
        lambdas/test_context_pipeline_e2e.py -v -s --noconftest
"""

from __future__ import annotations

import base64
import hashlib
import time
from pathlib import Path

import requests

_FIXTURES = Path(__file__).parent.parent / "fixtures"

_TEST_USER = "999000000000000000001"  # https://github.com/philkomarny/SkillStore/issues/27

_PDF_FILES = [
    "integration-test.pdf",
    "2403.05440v1.pdf",
    "jurafsky-ch22.pdf",  # https://github.com/philkomarny/SkillStore/issues/25
]

# ── API Gateway URLs (SkillStore#28) ──────────────────────────────────

_URL_UPLOAD   = "https://plvh12o05c.execute-api.us-west-2.amazonaws.com/prod/esm_live_upload_document_post"
_URL_GET_DOC  = "https://ikt0pbkcx1.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_document_get"
_URL_DEL_DOC  = "https://l9h3c7vji5.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_document_delete"

# https://github.com/philkomarny/SkillStore/issues/18
_URL_ADD_CONTEXT    = "https://vzy0yc5j2l.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_context_post"
_URL_GET_CONTEXT    = "https://hgvubq1ga7.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_context_get"
_URL_LIST_CONTEXTS  = "https://pr0dbmvk19.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_contexts_get"
_URL_DELETE_CONTEXT = "https://aj8uetqx8e.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_context_delete"

# ── Helpers ────────────────────────────────────────────────────────────────────


def _post(url: str, payload: dict) -> dict:
    resp = requests.post(url, json=payload, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _get(url: str, params: dict) -> dict:
    resp = requests.get(url, params=params, timeout=60)
    return {"statusCode": resp.status_code, "body": resp.json()}


def _delete_document_if_exists(md5: str) -> None:
    resp = requests.delete(_URL_DEL_DOC, params={"md5": md5, "user_id": _TEST_USER}, timeout=60)
    if resp.status_code == 200:
        print(f"  → pre-delete doc: removed md5={md5}")
    elif resp.status_code == 404:
        print(f"  → pre-delete doc: md5={md5} not in library (ok)")
    else:
        print(f"  → pre-delete doc: unexpected status={resp.status_code} (continuing)")


def _upload(filename: str, raw_bytes: bytes) -> str:
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
    print(f"  ✓ uploaded   md5={md5}  existed={body.get('existed', False)}")
    return md5


def _poll_until_ready(md5: str, timeout_s: int = 600, interval_s: int = 5) -> dict:
    print(f"  → polling {md5} (timeout={timeout_s}s) ...")
    deadline = time.monotonic() + timeout_s
    t0 = time.monotonic()
    attempt = 0
    while time.monotonic() < deadline:
        attempt += 1
        elapsed = int(time.monotonic() - t0)
        result = _get(_URL_GET_DOC, {"md5": md5})
        assert result["statusCode"] == 200, f"get-document error: {result}"
        body = result["body"]
        status = body.get("status")
        print(f"  [{elapsed:>3}s / attempt {attempt}]  md5={md5[:8]}...  status={status}")
        if status != "processing":
            return body
        time.sleep(interval_s)
    raise AssertionError(f"Document {md5} still 'processing' after {timeout_s}s")


# ── Test ───────────────────────────────────────────────────────────────────────


def test_context_pipeline_e2e():
    # https://github.com/philkomarny/SkillStore/issues/24

    # ── Phase 1: compute MD5s and pre-delete ──────────────────────────────────
    print("\n  === Phase 1: Pre-delete documents ===")
    pdf_data: list[tuple[str, bytes]] = []
    for filename in _PDF_FILES:
        raw = (_FIXTURES / filename).read_bytes()
        pdf_data.append((filename, raw))

    md5s: list[str] = []
    for filename, raw in pdf_data:
        expected_md5 = hashlib.md5(raw).hexdigest()
        _delete_document_if_exists(expected_md5)
        md5s.append(expected_md5)

    t_start = time.monotonic()

    # ── Phase 2: Upload ───────────────────────────────────────────────────────
    print("\n  === Phase 2: Upload PDFs ===")
    uploaded_md5s: list[str] = []
    for filename, raw in pdf_data:
        md5 = _upload(filename, raw)
        uploaded_md5s.append(md5)

    assert uploaded_md5s == md5s, "Server MD5s don't match expected"

    # ── Phase 3: Poll each until ready ────────────────────────────────────────
    print("\n  === Phase 3: Poll documents until ready ===")
    for md5 in uploaded_md5s:
        body = _poll_until_ready(md5)
        assert body.get("status") == "ready", f"Document {md5} not ready: {body.get('status')}"
        text = body.get("text") or ""
        print(f"  ✓ ready  md5={md5[:8]}...  chars={len(text):,}")

    # ── Phase 4: Create context via HTTP POST ─────────────────────────────────
    print("\n  === Phase 4: Create context ===")
    resp = requests.post(_URL_ADD_CONTEXT, json={
        "name": "Integration Test Context",
        "documents": uploaded_md5s,
        "user_id": _TEST_USER,
    }, timeout=120)
    assert resp.status_code == 201, f"add-context failed: {resp.status_code} {resp.text}"
    add_body = resp.json()
    context_id: str = add_body.get("contextId", "")
    assert context_id.startswith("ctx_"), f"contextId format wrong: {context_id}"
    assert add_body.get("status") == "ready", f"context status not ready: {add_body}"
    print(f"  ✓ context created  contextId={context_id}  status={add_body.get('status')}")

    # ── Phase 5: Get context via HTTP GET ────────────────────────────────────
    print("\n  === Phase 5: Get context and validate ===")
    resp = requests.get(_URL_GET_CONTEXT, params={"contextId": context_id}, timeout=30)
    assert resp.status_code == 200, f"get-context failed: {resp.status_code} {resp.text}"
    get_body = resp.json()
    assert get_body.get("status") == "ready", f"get-context status: {get_body.get('status')}"
    markdown = get_body.get("markdown") or ""
    assert markdown, "Context markdown is empty"
    # documents is [{md5, fileName, fileType}, ...] — extract MD5s for comparison
    documents = get_body.get("documents") or []
    doc_md5s = {d["md5"] for d in documents}
    assert doc_md5s == set(uploaded_md5s), f"documents mismatch: {doc_md5s}"
    print(f"  ✓ get-context ok  markdown={len(markdown):,} chars  documents={len(documents)}")

    out_dir = Path("/tmp/skillflow/esm-live-add-context")
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = int(time.monotonic() * 1000)
    out_path = out_dir / f"test-{ts}.md"
    out_path.write_text(markdown, encoding="utf-8")
    print(f"  → context saved: file://{out_path}")

    # ── Phase 6: List contexts via HTTP GET ───────────────────────────────────
    print("\n  === Phase 6: List contexts ===")
    resp = requests.get(_URL_LIST_CONTEXTS, params={"user_id": _TEST_USER}, timeout=30)
    assert resp.status_code == 200, f"list-contexts failed: {resp.status_code} {resp.text}"
    contexts: list[dict] = resp.json()
    listed_ids = [c.get("contextId") for c in contexts]
    assert context_id in listed_ids, f"contextId {context_id} not in list: {listed_ids}"
    print(f"  ✓ list-contexts ok  total={len(contexts)}  found={context_id}")

    # ── Phase 7: Delete context via HTTP DELETE ───────────────────────────────
    print("\n  === Phase 7: Delete context ===")
    resp = requests.delete(_URL_DELETE_CONTEXT, params={"contextId": context_id}, timeout=30)
    assert resp.status_code == 204, f"delete-context failed: {resp.status_code} {resp.text}"
    print(f"  ✓ delete-context ok  contextId={context_id}")

    # ── Phase 8: Confirm deletion via 404 ────────────────────────────────────
    print("\n  === Phase 8: Confirm deletion (expect 404) ===")
    resp = requests.get(_URL_GET_CONTEXT, params={"contextId": context_id}, timeout=30)
    assert resp.status_code == 404, (
        f"Expected 404 after delete, got {resp.status_code}: {resp.text}"
    )
    print(f"  ✓ 404 confirmed — context {context_id} is gone")

    elapsed = time.monotonic() - t_start
    print(f"\n  Total elapsed: {elapsed:.1f}s")
