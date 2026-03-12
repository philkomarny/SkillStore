"""Category page renders skill list."""
from .helpers import BASE_URL, new_page, check


def run(browser):
    print("\n── Category page: enrollment-admissions ─────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills/enrollment-admissions", wait_until="networkidle")
    body = p.inner_text("body")
    check("Category heading present", "Enrollment" in body)
    check("Has skill cards", "admitted-student-onboarding" in body or "onboarding" in body.lower())
    p.close()
