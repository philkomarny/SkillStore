"""Skill detail opens on click."""
from .helpers import BASE_URL, new_page, check, fail, PWTimeout


def run(browser):
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
