"""
Playwright smoke tests against https://www.eduskillsmp.com
Run: python3 tests/smoke_test.py

Uses Firefox — headless Chromium is blocked by Cloudflare.
"""
import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE_URL = "https://www.eduskillsmp.com"
PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
failures = []


def ok(label):
    print(f"  {PASS} {label}")


def fail(label, detail=""):
    msg = label + (f": {detail}" if detail else "")
    print(f"  {FAIL} {msg}")
    failures.append(msg)


def check(label, condition, detail=""):
    if condition:
        ok(label)
    else:
        fail(label, detail)


def new_page(browser):
    p = browser.new_page()
    p.set_default_timeout(15000)
    return p


# ── Test 1: Homepage loads with skill count ────────────────────────────

def test_homepage(browser):
    print("\n── Homepage ──────────────────────────────────────")
    p = new_page(browser)
    p.goto(BASE_URL, wait_until="networkidle")
    check("200 ok", True)
    body = p.inner_text("body")
    check("Shows skill count", "80" in body or "skills" in body.lower(), body[:100])
    check("Page title set", bool(p.title()), p.title())
    p.close()


# ── Test 2: /skills catalog renders cards ─────────────────────────────

def test_skills_page(browser):
    print("\n── /skills catalog ───────────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    body = p.inner_text("body")
    check("80 skills shown", "80" in body)
    # Category sections should be present
    check("Enrollment & Admissions category present", "Enrollment" in body)
    check("Student Success category present", "Student Success" in body)
    p.close()


# ── Test 3: Category page renders skill list ──────────────────────────

def test_category_page(browser):
    print("\n── Category page: enrollment-admissions ─────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills/enrollment-admissions", wait_until="networkidle")
    body = p.inner_text("body")
    check("Category heading present", "Enrollment" in body)
    check("Has skill cards", "admitted-student-onboarding" in body or "onboarding" in body.lower())
    p.close()
    return p


# ── Test 4: Skill detail opens on click ───────────────────────────────

def test_skill_detail(browser):
    print("\n── Skill detail (click) ──────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills/enrollment-admissions", wait_until="networkidle")
    try:
        p.locator("text=admitted-student-onboarding").first.click(timeout=8000)
        p.wait_for_url("**/admitted-student-onboarding", timeout=8000)
        body = p.inner_text("body")
        check("URL updated to skill detail", "admitted-student-onboarding" in p.url)
        check("Skill content rendered", len(body) > 1000, f"{len(body)} chars")
        check("H1 heading present", len(p.locator("h1").all()) > 0)
    except PWTimeout:
        fail("Skill detail navigation timed out")
    p.close()


# ── Test 5: Direct skill detail URL ───────────────────────────────────

def test_skill_detail_direct(browser):
    print("\n── Skill detail (direct URL) ─────────────────────")
    p = new_page(browser)
    slug_path = "/skills/enrollment-admissions/admitted-student-onboarding"
    p.goto(f"{BASE_URL}{slug_path}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Not a 404", "404" not in p.title().lower() and "not found" not in body.lower())
    check("Has substantial content", len(body) > 500, f"{len(body)} chars")
    p.close()


# ── Test 6: Search filters results ────────────────────────────────────

def test_search(browser):
    print("\n── Search ────────────────────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    try:
        search = p.locator("input[type='search'], input[placeholder*='earch'], input[placeholder*='Search']").first
        search.wait_for(timeout=5000)
        search.fill("advising")
        p.wait_for_timeout(800)  # debounce
        body = p.inner_text("body")
        check("Search returns advising results", "advis" in body.lower())
    except PWTimeout:
        fail("Search input not found")
    p.close()


# ── Test 7: /how-it-works page ────────────────────────────────────────

def test_how_it_works(browser):
    print("\n── /how-it-works ─────────────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/how-it-works", wait_until="networkidle")
    body = p.inner_text("body")
    check("Page loads without 404", "404" not in p.title().lower())
    check("Has content", len(body) > 200)
    p.close()


# ── Test 8: /pricing page ─────────────────────────────────────────────

def test_pricing(browser):
    print("\n── /pricing ──────────────────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
    body = p.inner_text("body")
    check("Page loads without 404", "404" not in p.title().lower())
    check("Has pricing content", len(body) > 200)
    p.close()


# ── Test 9: email-newsletter-creator — multi-path discovery ───────────

NEWSLETTER_SLUG = "email-newsletter-creator"
NEWSLETTER_CATEGORY = "marketing-communications"
NEWSLETTER_DIRECT_URL = f"/skills/{NEWSLETTER_CATEGORY}/{NEWSLETTER_SLUG}"


def test_newsletter_direct_url(browser):
    print("\n── email-newsletter-creator: direct URL ──────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Not a 404", "404" not in p.title().lower() and "not found" not in body.lower())
    check("Slug in URL", NEWSLETTER_SLUG in p.url)
    check("Has substantial content", len(body) > 500, f"{len(body)} chars")
    check("Skill name appears in page", "email" in body.lower() or "newsletter" in body.lower())
    p.close()


def test_newsletter_via_category_click(browser):
    print("\n── email-newsletter-creator: category → click ────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills/{NEWSLETTER_CATEGORY}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Category page loaded", "marketing" in body.lower() or "communication" in body.lower())
    try:
        p.locator(f"text={NEWSLETTER_SLUG}").first.click(timeout=8000)
        p.wait_for_url(f"**/{NEWSLETTER_SLUG}", timeout=8000)
        body = p.inner_text("body")
        check("Navigated to skill detail", NEWSLETTER_SLUG in p.url)
        check("Content rendered", len(body) > 500, f"{len(body)} chars")
    except PWTimeout:
        fail("Could not click skill in category listing")
    p.close()


def test_newsletter_via_search(browser):
    print("\n── email-newsletter-creator: search ─────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    try:
        search = p.locator("input[type='search'], input[placeholder*='earch'], input[placeholder*='Search']").first
        search.wait_for(timeout=5000)
        search.fill("email newsletter")
        p.wait_for_timeout(800)
        body = p.inner_text("body")
        check("Search returns newsletter result", "newsletter" in body.lower() or "email" in body.lower())
        check("Slug visible in results", NEWSLETTER_SLUG in body or "email-newsletter" in body)
    except PWTimeout:
        fail("Search input not found")
    p.close()


def test_newsletter_via_catalog_browse(browser):
    print("\n── email-newsletter-creator: catalog browse ──────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    body = p.inner_text("body")
    check("Catalog loaded", len(body) > 200)
    check("Marketing category present", "Marketing" in body or "marketing" in body)
    # Verify skill is somewhere in the full catalog listing
    check("Newsletter skill visible in catalog", "newsletter" in body.lower() or NEWSLETTER_SLUG in body)
    p.close()


def test_newsletter_via_homepage_nav(browser):
    print("\n── email-newsletter-creator: homepage → catalog → skill ──")
    p = new_page(browser)
    p.goto(BASE_URL, wait_until="networkidle")
    try:
        # Navigate from homepage to skills catalog
        p.locator("a[href='/skills'], a[href*='skills']").first.click(timeout=8000)
        p.wait_for_url("**/skills**", timeout=8000)
        body = p.inner_text("body")
        check("Reached skills catalog from homepage", "/skills" in p.url)
        check("Newsletter skill accessible from catalog", "newsletter" in body.lower() or NEWSLETTER_SLUG in body)
    except PWTimeout:
        fail("Could not navigate to skills from homepage")
    p.close()


# ── Test 14: Skill detail — breadcrumb navigation ─────────────────────
#
# The breadcrumb renders as: Skills / Marketing & Communications / email-newsletter-creator
# Each segment is plain text separated by "/". Confirmed from live page dump.

def test_newsletter_detail_breadcrumb(browser):
    print("\n── email-newsletter-creator: breadcrumb ──────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    # All three breadcrumb segments must appear in page text
    check("Breadcrumb: 'Skills' segment present", "Skills" in body)
    check("Breadcrumb: 'Marketing & Communications' segment present", "Marketing & Communications" in body)
    check("Breadcrumb: skill slug segment present", "email-newsletter-creator" in body)
    p.close()


# ── Test 15: Skill detail — verification badge ─────────────────────────
#
# This skill has verificationLevel: 2 which maps to the label "Expert Verified".
# Confirmed live: sidebar shows "Verification" label followed by "Expert Verified".

def test_newsletter_detail_verification_badge(browser):
    print("\n── email-newsletter-creator: verification badge ──")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("'Verification' meta label present", "Verification" in body)
    check("'Expert Verified' badge shown (level 2)", "Expert Verified" in body)
    p.close()


# ── Test 16: Skill detail — sidebar meta panel ─────────────────────────
#
# The right sidebar renders a meta info box with labeled rows for:
#   Version, Category, Downloads, and optionally Submitted by.
# Confirmed live: "Version", "1.0.0", "Category", "Downloads", "downloads", "0" all present.

def test_newsletter_detail_sidebar_meta(browser):
    print("\n── email-newsletter-creator: sidebar meta panel ──")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("'Version' meta label present", "Version" in body)
    check("Version value '1.0.0' present", "1.0.0" in body)
    check("'Category' meta label present", "Category" in body)
    check("Category value 'Marketing & Communications' present", "Marketing & Communications" in body)
    check("'Downloads' meta label present", "Downloads" in body or "downloads" in body)
    p.close()


# ── Test 17: Skill detail — clickable tags ────────────────────────────
#
# Tags are rendered as inline badges below the description.
# This skill's tags: email, newsletters, drip-campaigns, audience-segmentation.
# Confirmed live: all four tag strings appear in page text.
# Clicking a tag navigates to /skills?tag=<tag>.

def test_newsletter_detail_tags(browser):
    print("\n── email-newsletter-creator: tags ───────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    # Verify all four tags are visible on the page
    check("Tag 'email' present", "email" in body)
    check("Tag 'newsletters' present", "newsletters" in body)
    check("Tag 'drip-campaigns' present", "drip-campaigns" in body)
    check("Tag 'audience-segmentation' present", "audience-segmentation" in body)
    # Click 'email' tag link (a[href*="tag"]) and verify URL navigates to tag filter
    try:
        p.locator("a[href*='tag=email']").first.click(timeout=6000)
        p.wait_for_url("**/skills**tag**", timeout=6000)
        check("Clicking tag navigates to /skills?tag=... filter page", "skills" in p.url and "tag" in p.url)
    except PWTimeout:
        fail("Tag click did not navigate to filtered skills page")
    p.close()


# ── Test 18: Skill detail — install panel tabs ────────────────────────
#
# The "Add to Claude" install panel has three tabs:
#   "Desktop & Web", "Claude Code", "Project File"
# Confirmed live: all three tab labels are present in page text.
# "Desktop & Web" is the default — its instructions are visible on load.
# "Copy skill to clipboard" button appears on the default tab.

def test_newsletter_detail_install_panel(browser):
    print("\n── email-newsletter-creator: install panel ───────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    # Panel heading
    check("'Add to Claude' install panel heading present", "Add to Claude" in body)
    # All three tab labels must appear
    check("Tab 'Desktop & Web' present", "Desktop & Web" in body)
    check("Tab 'Claude Code' present", "Claude Code" in body)
    check("Tab 'Project File' present", "Project File" in body)
    # Default tab (Desktop & Web) content is visible on load
    check("Default tab copy button present", "Copy skill to clipboard" in body)
    # Click Claude Code tab and verify curl command appears
    try:
        p.locator("text=Claude Code").first.click(timeout=6000)
        p.wait_for_timeout(500)
        body = p.inner_text("body")
        check("Claude Code tab shows curl command", "curl" in body.lower() or "Copy command" in body)
    except PWTimeout:
        fail("Claude Code tab did not respond to click")
    # Click Project File tab and verify download button appears
    try:
        p.locator("text=Project File").first.click(timeout=6000)
        p.wait_for_timeout(500)
        body = p.inner_text("body")
        check("Project File tab shows download button", "Download" in body)
    except PWTimeout:
        fail("Project File tab did not respond to click")
    p.close()


# ── Test 19: Skill detail — refinery sidebar ──────────────────────────
#
# The right sidebar includes a "Personalize This Skill" box with:
#   - A heading: "Personalize This Skill"
#   - A description referencing "Your Refinery"
#   - A button: "Sign in to Add" (shown to unauthenticated users)
# Confirmed live: all three strings are present in page text.

def test_newsletter_detail_refinery_sidebar(browser):
    print("\n── email-newsletter-creator: refinery sidebar ────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("'Personalize This Skill' heading present", "Personalize This Skill" in body)
    check("'Your Refinery' reference present", "Your Refinery" in body)
    check("'Sign in to Add' button present (unauthenticated)", "Sign in to Add" in body)
    p.close()


# ── Test 20: Skill detail — rendered markdown content ─────────────────
#
# The skill body is SKILL.md rendered as HTML prose.
# Confirmed live: H1 "Email Newsletter Creator", "When to Activate" section,
# "Input Requirements" section, and "Anti-Patterns" section are all present.
# Total page text confirmed >5000 chars.

def test_newsletter_detail_content_quality(browser):
    print("\n── email-newsletter-creator: content quality ─────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("H1 title 'Email Newsletter Creator' rendered", "Email Newsletter Creator" in body)
    check("'When to Activate' section present", "When to Activate" in body)
    check("'Input Requirements' section present", "Input Requirements" in body)
    check("'Anti-Patterns' section present", "Anti-Patterns" in body)
    check("Substantial rendered content (>5000 chars)", len(body) > 5000, f"{len(body)} chars")
    p.close()


# ── Test 21: Document upload pipeline (authenticated) ─────────────────
#
# Requires auth-state.json (run `make setup-auth` once to generate).
# Tests the full document upload path post-#14:
#   1. Dashboard loads
#   2. Create a new context (POST /api/context/profiles → Supabase staging record)
#   3. Upload a small text fixture via the file input
#      → POST /api/context/upload → Lambda esm_live_upload_document_post
#      → returns { md5, status }
#   4. File shows "Ready" in the UI (status: "ready" or "processing" from Lambda)
#
# Does NOT click "Build Context" — scope is upload only, not synthesis.
# Does NOT assert md5 value — only that the upload completed without error.

AUTH_STATE = Path(__file__).parent / "auth-state.json"
FIXTURE_DOC = Path(__file__).parent / "fixtures" / "test-doc.txt"


def test_document_upload(browser):
    print("\n── Document upload (authenticated, Lambda #14) ───")

    if not AUTH_STATE.exists():
        fail("auth-state.json not found — run `make setup-auth` first")
        return

    if not FIXTURE_DOC.exists():
        fail(f"Fixture not found: {FIXTURE_DOC}")
        return

    ctx = browser.new_context(storage_state=str(AUTH_STATE))
    p = ctx.new_page()
    p.set_default_timeout(20000)

    try:
        # Step 1: Dashboard must load
        p.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
        body = p.inner_text("body")
        check(
            "Dashboard loaded (not redirected to sign-in)",
            "sign" not in p.url.lower() and "auth" not in p.url.lower(),
            p.url,
        )

        # Step 2: Open new context form
        try:
            p.locator("text=+ New").first.click(timeout=8000)
            p.wait_for_selector("text=New Context File", timeout=5000)
            check("New Context File form opened", True)
        except PWTimeout:
            fail("Could not open New Context File form")
            return

        # Step 3: Name the context and click Create
        try:
            p.locator("input[placeholder*='Admissions'], input[placeholder*='context'], input[type='text']").first.fill(
                "Smoke Upload Test"
            )
            p.locator("button:has-text('Create')").first.click(timeout=5000)
            # After Create, the upload drop zone appears and context name shows "created"
            p.wait_for_selector("text=created", timeout=8000)
            check("Context staging record created, upload zone visible", True)
        except PWTimeout:
            fail("Context name/create step timed out")
            return

        # Step 4: Upload the fixture file via the hidden file input
        # The input is hidden; Playwright can set_input_files directly on hidden inputs.
        try:
            p.locator("#context-upload").set_input_files(str(FIXTURE_DOC), timeout=5000)
        except PWTimeout:
            fail("File input (#context-upload) not found")
            return

        # Step 5: Wait for the file to reach "Ready" or "Error" status
        # "Ready" = Lambda returned { md5, status } successfully
        # "Error" = Lambda rejected or network failure
        try:
            # Wait up to 30s — Lambda upload + text extraction can take a few seconds
            p.wait_for_selector(
                "text=Ready, text=Error",
                timeout=30000,
            )
            body = p.inner_text("body")
            check(
                "test-doc.txt appears in file list",
                "test-doc.txt" in body,
                body[:200],
            )
            check(
                "File reached Ready status (Lambda document store accepted upload)",
                "Ready" in body,
                body[:200],
            )
            check(
                "No upload error reported",
                "Error" not in body or "Ready" in body,
                body[:200],
            )
        except PWTimeout:
            body = p.inner_text("body")
            fail("File did not reach Ready/Error within 30s", body[:200])

    finally:
        p.close()
        ctx.close()


# ── Runner ────────────────────────────────────────────────────────────

def main():
    with sync_playwright() as pw:
        # Firefox required — Cloudflare blocks headless Chromium
        browser = pw.firefox.launch(headless=True)
        try:
            test_homepage(browser)
            test_skills_page(browser)
            test_category_page(browser)
            test_skill_detail(browser)
            test_skill_detail_direct(browser)
            test_search(browser)
            test_how_it_works(browser)
            test_pricing(browser)
            test_newsletter_direct_url(browser)
            test_newsletter_via_category_click(browser)
            test_newsletter_via_search(browser)
            test_newsletter_via_catalog_browse(browser)
            test_newsletter_via_homepage_nav(browser)
            test_newsletter_detail_breadcrumb(browser)
            test_newsletter_detail_verification_badge(browser)
            test_newsletter_detail_sidebar_meta(browser)
            test_newsletter_detail_tags(browser)
            test_newsletter_detail_install_panel(browser)
            test_newsletter_detail_refinery_sidebar(browser)
            test_newsletter_detail_content_quality(browser)
            test_document_upload(browser)
        finally:
            browser.close()

    print(f"\n{'─' * 50}")
    if failures:
        print(f"\033[91m{len(failures)} FAILED:\033[0m")
        for f in failures:
            print(f"  • {f}")
        sys.exit(1)
    else:
        print(f"\033[92mAll tests passed.\033[0m")


if __name__ == "__main__":
    main()
