"""Document upload pipeline (authenticated). See #14, #35."""
from .helpers import BASE_URL, AUTH_STATE, FIXTURE_DOC, check, fail, PWTimeout


def run(browser):
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
        p.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        p.wait_for_load_state("networkidle")
        check(
            "Dashboard loaded (not redirected to sign-in)",
            "sign" not in p.url.lower() and "auth" not in p.url.lower(),
            p.url,
        )

        try:
            p.locator("text=+ New").first.click(timeout=8000)
            p.wait_for_selector("text=New Context File", timeout=5000)
            check("New Context File form opened", True)
        except PWTimeout:
            fail("Could not open New Context File form")
            return

        try:
            p.locator("input[placeholder*='Admissions 2024']").fill("Smoke Upload Test")
            p.get_by_role("button", name="Create", exact=True).click(timeout=5000)
            p.wait_for_selector("text=created", timeout=15000)
            check("Context staging record created, upload zone visible", True)
        except PWTimeout:
            fail("Context name/create step timed out")
            return

        try:
            p.locator("#context-upload").set_input_files(str(FIXTURE_DOC), timeout=5000)
        except PWTimeout:
            fail("File input (#context-upload) not found")
            return

        try:
            p.wait_for_selector("text=test-doc.txt", timeout=10000)
            check("test-doc.txt appears in file list", True)
        except PWTimeout:
            body = p.inner_text("body")
            fail("test-doc.txt never appeared in file list — onChange may not have fired", body[:200])
            return

        try:
            p.wait_for_selector(
                "xpath=//*[normalize-space(text())='Ready' or normalize-space(text())='Error']",
                timeout=30000,
            )
            body = p.inner_text("body")
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
