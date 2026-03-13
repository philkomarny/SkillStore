"""Document upload lifecycle: upload → S3 verify → MD5 check → delete → S3 verify.

Authenticated test that exercises the full document upload and deletion pipeline (#14)
and validates S3 state directly via boto3. Verifies:
  - MD5 from Lambda matches locally computed hash
  - Global store objects (metadata, original, extracted text) exist after upload
  - User library reference exists after upload
  - Library reference is removed after delete
  - Global store objects are preserved after delete (content-addressable, shared)
"""
import hashlib

import boto3
from botocore.exceptions import ClientError

from .helpers import BASE_URL, AUTH_STATE, FIXTURE_DOC, check, fail, goto, ok, PWTimeout

BUCKET = "mskillsiq"
# S3 layout — https://github.com/philkomarny/SkillStore/issues/16
STORE_PREFIX = "eduskillsmp/documents/store"
TEXT_STORE_PREFIX = "eduskillsmp/documents/text-store"
USER_STORE_PREFIX = "eduskillsmp/documents/user-store"

GET_ENDPOINT = "https://ikt0pbkcx1.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_document_get"
DELETE_ENDPOINT = "https://l9h3c7vji5.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_document_delete"

_session = boto3.Session(profile_name="transcriptiq_lambdaserviceuser", region_name="us-west-2")
s3 = _session.client("s3")


def _s3_uri(key: str) -> str:
    return f"s3://{BUCKET}/{key}"


def _s3_key_exists(key: str) -> bool:
    try:
        s3.head_object(Bucket=BUCKET, Key=key)
        return True
    except ClientError:
        return False


def _metadata_key(md5: str) -> str:
    return f"{STORE_PREFIX}/{md5[:2]}/{md5}.json"


def _original_key(md5: str, ext: str) -> str:
    return f"{STORE_PREFIX}/{md5[:2]}/{md5}{ext}"


def _text_key(md5: str) -> str:
    return f"{TEXT_STORE_PREFIX}/{md5[:2]}/{md5}.txt"


def _library_key(user_id: str, md5: str) -> str:
    return f"{USER_STORE_PREFIX}/{user_id}/{md5}.json"


def _get_user_id(page) -> str | None:
    """Extract Google OAuth subject ID from next-auth session."""
    resp = page.request.get(f"{BASE_URL}/api/auth/session")
    if resp.status != 200:
        return None
    data = resp.json()
    return data.get("user", {}).get("id")


def _cleanup_library_ref(user_id: str, md5: str):
    """Best-effort cleanup: remove user's library reference if it exists."""
    key = _library_key(user_id, md5)
    if _s3_key_exists(key):
        print(f"    cleanup: removing library ref {_s3_uri(key)}")
        s3.delete_object(Bucket=BUCKET, Key=key)
    else:
        print(f"    cleanup: no library ref at {_s3_uri(key)}")


def run(browser):
    print("\n── Document upload lifecycle (upload → S3 → MD5 → delete → S3) ───")

    if not AUTH_STATE.exists():
        fail("auth-state.json not found — run `make setup-auth` first")
        return

    if not FIXTURE_DOC.exists():
        fail(f"Fixture not found: {FIXTURE_DOC}")
        return

    # ── Compute expected MD5 locally ──
    fixture_bytes = FIXTURE_DOC.read_bytes()
    expected_md5 = hashlib.md5(fixture_bytes).hexdigest()
    print(f"    fixture: {FIXTURE_DOC.name} ({len(fixture_bytes)} bytes)")
    print(f"    expected MD5: {expected_md5}")
    print(f"    S3 metadata:  {_s3_uri(_metadata_key(expected_md5))}")
    print(f"    S3 original:  {_s3_uri(_original_key(expected_md5, '.txt'))}")
    print(f"    S3 extracted: {_s3_uri(_text_key(expected_md5))}")

    ctx = browser.new_context(storage_state=str(AUTH_STATE))
    page = ctx.new_page()
    page.set_default_timeout(20000)

    try:
        # ── Get user ID from session ──
        print(f"    fetching session from {BASE_URL}/api/auth/session")
        goto(page, f"{BASE_URL}/dashboard")
        user_id = _get_user_id(page)
        if not user_id:
            fail("Could not extract user ID from /api/auth/session")
            return
        ok(f"Session user_id: {user_id}")
        print(f"    S3 library:   {_s3_uri(_library_key(user_id, expected_md5))}")

        # ── [1/6] Pre-cleanup ──
        print("\n  [1/6] Pre-cleanup: remove leftover library reference")
        _cleanup_library_ref(user_id, expected_md5)

        # ── [2/6] Upload document via UI ──
        print("\n  [2/6] Upload document via UI")
        try:
            print("    clicking '+ New' to open ContextBuilder")
            page.locator("text=+ New").first.click(timeout=8000)
            page.wait_for_selector("text=New Context File", timeout=5000)
            ok("New Context File form opened")
        except PWTimeout:
            fail("Could not open New Context File form")
            return

        try:
            print("    naming context 'Smoke Doc Lifecycle', clicking Create")
            page.locator("input[placeholder*='Admissions 2024']").fill("Smoke Doc Lifecycle")
            page.get_by_role("button", name="Create", exact=True).click(timeout=5000)
            page.wait_for_selector("text=created", timeout=15000)
            ok("Context staging record created, upload zone visible")
        except PWTimeout:
            fail("Context name/create step timed out")
            return

        try:
            print(f"    setting file input: {FIXTURE_DOC.name}")
            page.locator("#context-upload").set_input_files(str(FIXTURE_DOC), timeout=5000)
        except PWTimeout:
            fail("File input (#context-upload) not found")
            return

        try:
            page.wait_for_selector("text=test-doc.txt", timeout=10000)
            ok("test-doc.txt appears in file list")
        except PWTimeout:
            fail("test-doc.txt never appeared in file list")
            return

        try:
            print("    waiting for Ready/Error status (up to 30s)...")
            page.wait_for_selector(
                "xpath=//*[normalize-space(text())='Ready' or normalize-space(text())='Error']",
                timeout=30000,
            )
            body = page.inner_text("body")
            check("File reached Ready status", "Ready" in body, body[:200])
        except PWTimeout:
            body = page.inner_text("body")
            fail("File did not reach Ready/Error within 30s", body[:200])
            return

        # ── [3/6] Verify MD5 hash via GET document Lambda API ──
        print("\n  [3/6] Verify MD5 hash via GET document API")
        md5 = expected_md5
        get_url = f"{GET_ENDPOINT}?md5={expected_md5}"
        print(f"    GET {get_url}")
        get_resp = page.request.get(get_url)
        print(f"    response status: {get_resp.status}")
        if get_resp.status == 200:
            doc = get_resp.json()
            api_md5 = doc.get("md5", "")
            api_filename = doc.get("filename", "")
            api_status = doc.get("status", "")
            api_size = doc.get("size_bytes", 0)
            print(f"    API returned: md5={api_md5} filename={api_filename} status={api_status} size={api_size}")
            check("GET document API returns expected MD5", api_md5 == expected_md5, f"got {api_md5}")
            check("GET document API filename matches fixture", api_filename == FIXTURE_DOC.name, f"got {api_filename}")
            check("GET document API status is ready", api_status == "ready", f"got {api_status}")
            check("GET document API size matches fixture", api_size == len(fixture_bytes), f"got {api_size} expected {len(fixture_bytes)}")
        else:
            fail(f"GET document API returned {get_resp.status} for md5={expected_md5}")

        # ── [4/6] S3 verify after upload ──
        print("\n  [4/6] S3 verify after upload")

        meta_key = _metadata_key(md5)
        print(f"    checking global metadata: {_s3_uri(meta_key)}")
        check("S3 global metadata.json exists", _s3_key_exists(meta_key), _s3_uri(meta_key))

        orig_key = _original_key(md5, ".txt")
        print(f"    checking original file:   {_s3_uri(orig_key)}")
        check("S3 original file exists", _s3_key_exists(orig_key), _s3_uri(orig_key))

        lib_key = _library_key(user_id, md5)
        print(f"    checking library ref:     {_s3_uri(lib_key)}")
        check("S3 user library ref exists", _s3_key_exists(lib_key), _s3_uri(lib_key))

        # ── [5/6] S3 verify extraction completed ──
        print("\n  [5/6] S3 verify text extraction completed")

        txt_key = _text_key(md5)
        print(f"    checking extracted text:   {_s3_uri(txt_key)}")
        txt_exists = _s3_key_exists(txt_key)
        check("S3 extracted text exists", txt_exists, _s3_uri(txt_key))

        if txt_exists:
            obj = s3.get_object(Bucket=BUCKET, Key=txt_key)
            text_content = obj["Body"].read().decode("utf-8")
            text_len = len(text_content)
            print(f"    extracted text: {text_len} chars")
            has_expected = text_len > 50 and "applicants" in text_content.lower()
            check("Extracted text contains expected content", has_expected, f"length={text_len}")

        # ── [6/6] Delete document via Lambda API + S3 verify ──
        print("\n  [6/6] Delete document via Lambda API")

        delete_url = f"{DELETE_ENDPOINT}?md5={md5}&user_id={user_id}"
        print(f"    DELETE {delete_url}")
        resp = page.request.delete(delete_url)
        print(f"    response status: {resp.status}")

        if resp.status == 200:
            delete_body = resp.json()
            print(f"    response body: md5={delete_body.get('md5')} removed={delete_body.get('removed')}")
            check("Delete API returned 200", True)
            check("Delete confirms removal", delete_body.get("removed") is True, str(delete_body))
        else:
            fail(f"Delete API returned {resp.status}", resp.text())

        # Verify library ref is gone
        print(f"\n    verifying library ref removed: {_s3_uri(lib_key)}")
        lib_gone = not _s3_key_exists(lib_key)
        check("S3 library ref removed after delete", lib_gone, _s3_uri(lib_key))

        # Verify global records are preserved (content-addressable store is shared)
        print(f"    verifying global metadata preserved: {_s3_uri(meta_key)}")
        check("S3 global metadata still exists (content-addressable)", _s3_key_exists(meta_key), _s3_uri(meta_key))

        print(f"    verifying original file preserved:   {_s3_uri(orig_key)}")
        check("S3 original file still exists", _s3_key_exists(orig_key), _s3_uri(orig_key))

        print(f"    verifying extracted text preserved:   {_s3_uri(txt_key)}")
        check("S3 extracted text still exists", _s3_key_exists(txt_key), _s3_uri(txt_key))

        print()
        ok("Full lifecycle: upload → S3 verify → MD5 verify → delete → S3 verify")

    finally:
        page.close()
        ctx.close()
