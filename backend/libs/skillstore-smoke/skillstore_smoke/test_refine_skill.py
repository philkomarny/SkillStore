"""Skill refinement lifecycle: copy skill → build context → select both → refine → verify.

Authenticated test that exercises the full refine flow (#39):
  1. Copy a catalog skill to the Refinery
  2. Create a context (name, upload fixture doc, Build Context)
  3. Select the skill in My Skills
  4. Select the context in My Contexts
  5. Click "Refine Skill", wait for completion
  6. Verify "Refinement Complete" appears
  7. Clean up: delete the skill and context
"""
from pathlib import Path

from .helpers import BASE_URL, AUTH_STATE, check, fail, ok, PWTimeout

FIXTURE_DOC = Path(__file__).parent / "fixtures" / "test-doc.txt"

TEST_SKILL_SLUG = "irb-protocol-writer"
TEST_SKILL_CATEGORY = "compliance-accreditation"
CONTEXT_NAME = "Smoke Refine Context"


def _cleanup_skill(page):
    """Best-effort: delete test skill from My Skills if present."""
    try:
        trash = page.locator("button[title='Delete skill']").first
        if trash.is_visible(timeout=2000):
            trash.click(timeout=3000)
            page.get_by_role("button", name="Yes, delete").click(timeout=3000)
            page.wait_for_timeout(2000)
    except Exception:
        pass


def _cleanup_context(page):
    """Best-effort: delete test context from My Contexts if present."""
    try:
        trash = page.locator("button[title='Delete context']").first
        if trash.is_visible(timeout=2000):
            trash.click(timeout=3000)
            page.get_by_role("button", name="Yes, delete").click(timeout=3000)
            page.wait_for_timeout(2000)
    except Exception:
        pass


def run(browser):
    print("\n── Skill refinement (copy → context → refine → verify) ───")

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
        # ── Pre-cleanup: remove leftover skill/context from prior runs ──
        page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
        check(
            "Dashboard loaded",
            "sign" not in page.url.lower() and "auth" not in page.url.lower(),
            page.url,
        )

        body = page.inner_text("body")
        if TEST_SKILL_SLUG in body or "irb-protocol" in body.lower():
            print("    pre-cleanup: removing leftover test skill")
            _cleanup_skill(page)
            page.wait_for_load_state("networkidle")

        body = page.inner_text("body")
        if CONTEXT_NAME in body:
            print("    pre-cleanup: removing leftover test context")
            _cleanup_context(page)
            page.wait_for_load_state("networkidle")

        # ── Step 1: Copy skill to Refinery ──
        print("\n  [1/7] Copy skill to Refinery")
        skill_url = f"{BASE_URL}/skills/{TEST_SKILL_CATEGORY}/{TEST_SKILL_SLUG}"
        page.goto(skill_url, wait_until="networkidle")
        check("Skill detail page loaded", TEST_SKILL_SLUG in page.url, page.url)

        try:
            page.get_by_role("button", name="Add to Your Refinery").click(timeout=8000)
            page.wait_for_url("**/dashboard**", timeout=15000)
            page.wait_for_load_state("networkidle")
            check("Redirected to dashboard after copy", "dashboard" in page.url, page.url)
        except PWTimeout:
            fail("Add to Refinery button not found or redirect failed")
            return

        # ── Step 2: Build a context ──
        print("\n  [2/7] Build context from fixture document")
        try:
            page.locator("text=+ New").first.click(timeout=8000)
            page.wait_for_selector("text=New Context File", timeout=5000)
        except PWTimeout:
            fail("Could not open New Context File form")
            return

        try:
            page.locator("input[placeholder*='Admissions 2024']").fill(CONTEXT_NAME)
            page.get_by_role("button", name="Create", exact=True).click(timeout=5000)
            page.wait_for_selector("text=created", timeout=5000)
        except PWTimeout:
            fail("Context name step timed out")
            return

        try:
            page.locator("#context-upload").set_input_files(str(FIXTURE_DOC), timeout=5000)
            page.wait_for_selector(
                "xpath=//*[normalize-space(text())='Ready' or normalize-space(text())='Error']",
                timeout=30000,
            )
            body = page.inner_text("body")
            check("Document uploaded and ready", "Ready" in body, body[:200])
        except PWTimeout:
            fail("Document upload did not complete")
            return

        try:
            page.get_by_role("button", name="Build Context").click(timeout=5000)
            page.wait_for_selector("text=Building context with AI", timeout=5000)
            # Wait for synthesis to finish — context appears in My Contexts list
            page.wait_for_selector(f"text={CONTEXT_NAME}", timeout=60000)
            page.wait_for_load_state("networkidle")
            check("Context built successfully", True)
        except PWTimeout:
            fail("Build Context did not complete within 60s")
            return

        # Reload dashboard to clear client selection state (Build Context
        # auto-selects the context via handleContextCreated — clicking it again
        # would toggle it OFF since DashboardClient uses toggle selection).
        print("\n  [3/7] Reload dashboard and select skill")
        page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")

        # Click the skill selection button (#39). The row contains:
        #   <button class="flex-1 ...">name</button>  ← selection (first child)
        #   <a href="/dashboard/skills/slug">           ← eye icon link
        #   <button title="Delete skill">               ← delete
        # Strategy: find the <a> by its href, go to immediate parent (the row
        # div), then click the first <button> child (the selection button).
        try:
            skill_link = page.locator(f"a[href='/dashboard/skills/{TEST_SKILL_SLUG}']")
            skill_row = skill_link.locator("xpath=..")
            skill_btn = skill_row.locator("button").first
            skill_btn.click(timeout=8000)
            page.wait_for_timeout(1000)
            # Verify: the Refinery placeholder should be replaced with skill info
            body = page.inner_text("body")
            skill_selected = "Select a skill from My Skills above" not in body
            check("Skill selected (visible in Refinery)", skill_selected, body[:300])
        except PWTimeout:
            fail("Could not find/click skill selection button in My Skills")
            return

        # ── Step 4: Select the context (#39) ──
        print("\n  [4/7] Select context in My Contexts")
        try:
            # The context selection button contains the context name as text.
            # Use filter(has_text=) to find the right button directly.
            ctx_btn = page.locator("button").filter(has_text=CONTEXT_NAME).first
            ctx_btn.click(timeout=8000)
            page.wait_for_timeout(1000)
            # Verify: the Refinery placeholder should be replaced with context info
            body = page.inner_text("body")
            ctx_selected = "Select a context from My Contexts above" not in body
            check("Context selected (visible in Refinery)", ctx_selected, body[:300])
        except PWTimeout:
            fail(f"Could not find/click context '{CONTEXT_NAME}' selection button")
            return

        # ── Step 5: Click Refine Skill (#39) ──
        print("\n  [5/7] Refine skill with context")
        try:
            refine_btn = page.get_by_role("button", name="Refine Skill")
            # Log button state and Refinery text for debugging
            is_disabled = refine_btn.get_attribute("disabled")
            refinery_el = page.locator("text=Your Skills Refinery").locator("xpath=ancestor::div[contains(@class,'rounded-xl')]")
            refinery_text = refinery_el.inner_text(timeout=3000)
            print(f"    Refine button disabled={is_disabled}")
            print(f"    Refinery text: {refinery_text[:200]}")
            refine_btn.click(timeout=5000)
            page.wait_for_selector("text=Refining with AI", timeout=15000)
            check("Refinement started (spinner visible)", True)
        except PWTimeout:
            body = page.inner_text("body")
            fail("Refine Skill button not clickable or spinner did not appear", body[:500])
            return

        # ── Step 6: Wait for refinement to complete (#39) ──
        print("\n  [6/7] Wait for refinement result")
        try:
            # Wait for either success ("Refinement Complete") or error text
            page.wait_for_selector(
                "xpath=//*[contains(text(),'Refinement Complete') or contains(@class,'text-red')]",
                timeout=120000,
            )
            body = page.inner_text("body")
            if "Refinement Complete" in body:
                check("Refinement Complete shown", True, body[:300])
            else:
                fail("Refinement returned an error", body[:500])
                return
        except PWTimeout:
            body = page.inner_text("body")
            # Dump the full Refinery section for diagnostics
            try:
                ref_el = page.locator("text=Your Skills Refinery").locator(
                    "xpath=ancestor::div[contains(@class,'rounded-xl')]"
                )
                ref_text = ref_el.inner_text(timeout=2000)
                print(f"    Refinery section: {ref_text[:400]}")
            except Exception:
                pass
            fail("Refinement did not complete within 120s", body[:500])
            return

        # ── Step 7: Clean up ──
        print("\n  [7/7] Clean up test skill and context")
        page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
        _cleanup_skill(page)
        page.wait_for_load_state("networkidle")
        _cleanup_context(page)
        page.wait_for_load_state("networkidle")
        ok("Cleanup complete")

        print()
        ok("Full refine lifecycle: copy → context → select → refine → verify → cleanup")

    finally:
        page.close()
        ctx.close()
