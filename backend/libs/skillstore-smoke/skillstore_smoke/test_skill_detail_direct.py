"""Direct skill detail URL."""
from .helpers import BASE_URL, new_page, check


def run(browser):
    print("\n── Skill detail (direct URL) ─────────────────────")
    p = new_page(browser)
    slug_path = "/skills/enrollment-admissions/admitted-student-onboarding"
    p.goto(f"{BASE_URL}{slug_path}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Not a 404", "404" not in p.title().lower() and "not found" not in body.lower())
    check("Has substantial content", len(body) > 500, f"{len(body)} chars")
    p.close()
