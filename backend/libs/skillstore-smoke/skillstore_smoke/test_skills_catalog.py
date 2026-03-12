"""/skills catalog renders cards."""
from .helpers import BASE_URL, new_page, check


def run(browser):
    print("\n── /skills catalog ───────────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    body = p.inner_text("body")
    check("80 skills shown", "80" in body)
    check("Enrollment & Admissions category present", "Enrollment" in body)
    check("Student Success category present", "Student Success" in body)
    p.close()
