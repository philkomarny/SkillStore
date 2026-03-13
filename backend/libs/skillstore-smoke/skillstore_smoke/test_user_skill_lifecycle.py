"""User skill Refinery lifecycle: copy → S3 exists → view → delete → S3 gone.

Authenticated test that exercises the full user-skill CRUD path (#30, #33)
and validates S3 state directly via boto3.
"""
import boto3
from botocore.exceptions import ClientError

from .helpers import BASE_URL, AUTH_STATE, check, fail, ok, PWTimeout

BUCKET = "mskillsiq"
S3_PREFIX = "eduskillsmp/skills/user"
TEST_SKILL_SLUG = "irb-protocol-writer"
TEST_SKILL_CATEGORY = "compliance-accreditation"

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


def _s3_metadata_key(user_id: str, slug: str) -> str:
    return f"{S3_PREFIX}/{user_id}/{slug}/metadata.json"


def _s3_content_key(user_id: str, slug: str) -> str:
    return f"{S3_PREFIX}/{user_id}/{slug}/v1.md"


def _get_user_id(page) -> str | None:
    """Extract Google OAuth subject ID from next-auth session."""
    resp = page.request.get(f"{BASE_URL}/api/auth/session")
    if resp.status != 200:
        return None
    data = resp.json()
    return data.get("user", {}).get("id")


def _cleanup_skill(user_id: str, slug: str):
    """Best-effort cleanup: delete user-skill from S3 if it exists."""
    prefix = f"{S3_PREFIX}/{user_id}/{slug}/"
    try:
        listing = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix)
        objects = listing.get("Contents", [])
        if objects:
            keys = [o["Key"] for o in objects]
            print(f"    cleanup: removing {len(keys)} leftover object(s) under {_s3_uri(prefix)}")
            for k in keys:
                print(f"      - {k}")
            s3.delete_objects(
                Bucket=BUCKET,
                Delete={"Objects": [{"Key": k} for k in keys]},
            )
        else:
            print(f"    cleanup: no leftover objects at {_s3_uri(prefix)}")
    except ClientError:
        pass


def run(browser):
    print("\n── User skill lifecycle (copy → S3 → view → delete → S3) ───")

    if not AUTH_STATE.exists():
        fail("auth-state.json not found — run `make setup-auth` first")
        return

    ctx = browser.new_context(storage_state=str(AUTH_STATE))
    page = ctx.new_page()
    page.set_default_timeout(20000)

    try:
        # ── Get user ID from session ──
        print(f"    fetching session from {BASE_URL}/api/auth/session")
        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        user_id = _get_user_id(page)
        if not user_id:
            fail("Could not extract user ID from /api/auth/session")
            return
        ok(f"Session user_id: {user_id}")

        s3_prefix = f"{S3_PREFIX}/{user_id}/{TEST_SKILL_SLUG}/"
        print(f"    S3 prefix: {_s3_uri(s3_prefix)}")

        # ── Cleanup: ensure test skill is not already in refinery ──
        _cleanup_skill(user_id, TEST_SKILL_SLUG)

        # ── Step 1: Copy skill to refinery ──
        skill_url = f"{BASE_URL}/skills/{TEST_SKILL_CATEGORY}/{TEST_SKILL_SLUG}"
        print("\n  [1/5] Copy skill to refinery")
        print(f"    navigating to {skill_url}")
        page.goto(skill_url, wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        check("Skill detail page loaded", TEST_SKILL_SLUG in page.url, page.url)

        try:
            print("    clicking 'Add to Your Refinery'")
            page.get_by_role("button", name="Add to Your Refinery").click(timeout=8000)
            page.wait_for_url("**/dashboard**", timeout=15000)
            print(f"    redirected to {page.url}")
            check("Redirected to dashboard after copy", "dashboard" in page.url, page.url)
        except PWTimeout:
            fail("Add to Refinery button not found or redirect failed")
            return

        # Verify skill shows up in My Skills list
        page.wait_for_load_state("networkidle")
        body = page.inner_text("body")
        check(
            "Skill appears in My Skills list",
            TEST_SKILL_SLUG in body or "irb-protocol" in body.lower() or "IRB" in body,
            body[:300],
        )

        # ── Step 2: Verify S3 objects exist ──
        meta_key = _s3_metadata_key(user_id, TEST_SKILL_SLUG)
        content_key = _s3_content_key(user_id, TEST_SKILL_SLUG)

        print("\n  [2/5] Verify S3 objects exist after copy")
        print(f"    checking {_s3_uri(meta_key)}")
        meta_exists = _s3_key_exists(meta_key)
        check("S3 metadata.json exists", meta_exists, _s3_uri(meta_key))

        print(f"    checking {_s3_uri(content_key)}")
        content_exists = _s3_key_exists(content_key)
        check("S3 v1.md exists", content_exists, _s3_uri(content_key))

        # ── Step 3: Click View Skill (eye icon) ──
        print("\n  [3/5] View skill detail page")
        view_url = f"/dashboard/skills/{TEST_SKILL_SLUG}"
        print(f"    clicking eye icon → {view_url}")
        try:
            view_link = page.locator(f"a[href='{view_url}']").first
            view_link.click(timeout=8000)
            page.wait_for_url(f"**{view_url}**", timeout=10000)
            page.wait_for_load_state("networkidle")
            print(f"    loaded {page.url}")
            check(
                "View Skill page loaded (not 404)",
                "404" not in page.inner_text("body") and view_url in page.url,
                page.url,
            )
            body = page.inner_text("body")
            body_len = len(body)
            has_content = body_len > 200 and ("IRB" in body or "protocol" in body.lower())
            print(f"    rendered body: {body_len} chars")
            check("Skill markdown content rendered", has_content, f"body length: {body_len}")
        except PWTimeout:
            fail(f"View Skill page did not load at {view_url}", page.url)

        # ── Step 4: Delete skill from refinery ──
        print("\n  [4/5] Delete skill from refinery")
        page.wait_for_timeout(2000)
        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        print("    back on dashboard, clicking trash icon")

        try:
            trash_btn = page.locator("button[title='Delete skill']").first
            trash_btn.click(timeout=8000)
            print("    confirming deletion")
            page.get_by_role("button", name="Yes, delete").click(timeout=8000)
            # Wait for the skill row to disappear from the DOM after
            # router.refresh() re-renders the server component.
            try:
                page.locator(f"a[href='/dashboard/skills/{TEST_SKILL_SLUG}']").wait_for(
                    state="hidden", timeout=10000,
                )
            except PWTimeout:
                # Row didn't disappear — reload and re-check
                page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
                page.wait_for_load_state("networkidle")

            body = page.inner_text("body")
            skill_gone = TEST_SKILL_SLUG not in body and "irb-protocol-writer" not in body.lower()
            check("Skill removed from My Skills list", skill_gone, body[:300])
        except PWTimeout:
            fail("Delete flow failed — trash or confirm button not found")
            return

        # ── Step 5: Verify S3 objects are gone ──
        print("\n  [5/5] Verify S3 objects removed after delete")
        print(f"    checking {_s3_uri(meta_key)}")
        meta_gone = not _s3_key_exists(meta_key)
        check("S3 metadata.json removed", meta_gone, _s3_uri(meta_key))

        print(f"    checking {_s3_uri(content_key)}")
        content_gone = not _s3_key_exists(content_key)
        check("S3 v1.md removed", content_gone, _s3_uri(content_key))

        print()
        ok("Full lifecycle: copy → S3 verify → view → delete → S3 verify")

    finally:
        page.close()
        ctx.close()
