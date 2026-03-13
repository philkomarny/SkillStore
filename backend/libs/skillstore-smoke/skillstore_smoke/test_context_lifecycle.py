"""Context lifecycle: create → appears in list as Ready → delete → gone.

Authenticated test that exercises the full Build Context flow (#38):
  1. Open dashboard
  2. Click "+ New", name the context, confirm
  3. Upload a fixture document, wait for "Ready"
  4. Click "Build Context", wait for synthesis to complete
  5. Verify the context appears in My Contexts with "Ready" status
  6. Delete the context
  7. Verify it is removed from My Contexts
"""
from pathlib import Path

from .helpers import BASE_URL, AUTH_STATE, check, fail, goto, ok, PWTimeout

FIXTURE_DOC = Path(__file__).parent / "fixtures" / "test-doc.txt"
CONTEXT_NAME = "Smoke Context Test"


def _cleanup_named_context(page, name):
    """Best-effort: delete a context by name from My Contexts if present."""
    try:
        btn = page.locator("button").filter(has_text=name).first
        if btn.is_visible(timeout=2000):
            row = btn.locator("xpath=..")
            trash = row.locator("button[title='Delete context']")
            trash.click(timeout=3000)
            page.get_by_role("button", name="Yes, delete").click(timeout=3000)
            page.wait_for_timeout(2000)
    except Exception:
        pass


def run(browser):
    print("\n── Context lifecycle (create → ready → delete) ───")

    if not AUTH_STATE.exists():
        fail("auth-state.json not found — run `make setup-auth` first")
        return

    if not FIXTURE_DOC.exists():
        fail(f"Fixture not found: {FIXTURE_DOC}")
        return

    ctx = browser.new_context(storage_state=str(AUTH_STATE))
    page = ctx.new_page()
    page.set_default_timeout(20000)

    try:
        # ── Navigate to dashboard ──
        goto(page, f"{BASE_URL}/dashboard")
        check(
            "Dashboard loaded (not redirected to sign-in)",
            "sign" not in page.url.lower() and "auth" not in page.url.lower(),
            page.url,
        )

        # ── Pre-cleanup: remove leftover contexts from prior runs (#38) ──
        body = page.inner_text("body")
        while CONTEXT_NAME in body:
            print("    pre-cleanup: removing leftover test context")
            _cleanup_named_context(page, CONTEXT_NAME)
            page.wait_for_load_state("networkidle")
            body = page.inner_text("body")

        # ── Step 1: Open New Context File form ──
        print("\n  [1/7] Open New Context File form")
        try:
            page.locator("text=+ New").first.click(timeout=8000)
            page.wait_for_selector("text=New Context File", timeout=5000)
            check("New Context File form opened", True)
        except PWTimeout:
            fail("Could not open New Context File form")
            return

        # ── Step 2: Name the context and confirm ──
        print("\n  [2/7] Name the context")
        try:
            page.locator("input[placeholder*='Admissions 2024']").fill(CONTEXT_NAME)
            page.get_by_role("button", name="Create", exact=True).click(timeout=5000)
            page.wait_for_selector("text=created", timeout=5000)
            check("Context name confirmed, upload zone visible", True)
        except PWTimeout:
            fail("Context name/create step timed out")
            return

        # ── Step 3: Upload fixture document ──
        print("\n  [3/7] Upload fixture document")
        try:
            page.locator("#context-upload").set_input_files(str(FIXTURE_DOC), timeout=5000)
        except PWTimeout:
            fail("File input (#context-upload) not found")
            return

        try:
            page.wait_for_selector("text=test-doc.txt", timeout=10000)
            check("test-doc.txt appears in file list", True)
        except PWTimeout:
            fail("test-doc.txt never appeared in file list")
            return

        try:
            page.wait_for_selector(
                "xpath=//*[normalize-space(text())='Ready' or normalize-space(text())='Error']",
                timeout=30000,
            )
            body = page.inner_text("body")
            check("File reached Ready status", "Ready" in body, body[:200])
        except PWTimeout:
            fail("File did not reach Ready/Error within 30s")
            return

        # ── Step 4: Click Build Context ──
        print("\n  [4/7] Build Context (Bedrock synthesis)")
        try:
            page.get_by_role("button", name="Build Context").click(timeout=5000)
            # Synthesis takes 5–15s typical, allow up to 60s
            page.wait_for_selector("text=Building context with AI", timeout=5000)
            check("Build Context started (spinner visible)", True)
        except PWTimeout:
            fail("Build Context button not found or spinner did not appear")
            return

        # Wait for synthesis to finish — the ContextBuilder calls onCreated which
        # closes the form and the context appears in MyContextsList
        try:
            page.wait_for_selector(
                f"text={CONTEXT_NAME}",
                timeout=60000,
            )
            # Give the page a moment to settle after the context appears
            page.wait_for_load_state("networkidle")
        except PWTimeout:
            fail("Context did not appear in list after Build Context (60s timeout)")
            return

        # ── Step 5: Verify context appears with Ready status ──
        print("\n  [5/7] Verify context in My Contexts list")
        body = page.inner_text("body")
        check(
            f"Context '{CONTEXT_NAME}' appears in My Contexts",
            CONTEXT_NAME in body,
            body[:300],
        )
        check(
            "Context has 'Ready' status badge",
            "Ready" in body,
            body[:300],
        )

        # ── Step 6: Delete the context (#38) ──
        print("\n  [6/7] Delete context")
        try:
            # Target the trash button in the same row as our context name.
            # The selection button contains the name; its immediate parent is
            # the row div which also holds the delete button.
            ctx_btn = page.locator("button").filter(has_text=CONTEXT_NAME).first
            ctx_row = ctx_btn.locator("xpath=..")
            trash_btn = ctx_row.locator("button[title='Delete context']")
            trash_btn.click(timeout=8000)
            page.get_by_role("button", name="Yes, delete").click(timeout=8000)
            page.wait_for_timeout(3000)
            page.wait_for_load_state("networkidle")
            check("Delete confirmed", True)
        except PWTimeout:
            fail("Delete flow failed — trash or confirm button not found")
            return

        # ── Step 7: Verify context is gone ──
        print("\n  [7/7] Verify context removed from list")
        # Reload to ensure we see fresh server state after delete
        goto(page, f"{BASE_URL}/dashboard")
        body = page.inner_text("body")
        context_gone = CONTEXT_NAME not in body
        check(
            f"Context '{CONTEXT_NAME}' removed from My Contexts",
            context_gone,
            body[:300],
        )

        print()
        ok("Full context lifecycle: create → upload → build → verify → delete → verify")

    finally:
        page.close()
        ctx.close()
