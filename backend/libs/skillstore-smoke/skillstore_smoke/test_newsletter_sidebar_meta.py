"""email-newsletter-creator sidebar meta panel."""
from .helpers import BASE_URL, NEWSLETTER_DIRECT_URL, new_page, check


def run(browser):
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
