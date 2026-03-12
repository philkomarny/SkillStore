"""email-newsletter-creator breadcrumb navigation."""
from .helpers import BASE_URL, NEWSLETTER_DIRECT_URL, new_page, check


def run(browser):
    print("\n── email-newsletter-creator: breadcrumb ──────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Breadcrumb: 'Skills' segment present", "Skills" in body)
    check("Breadcrumb: 'Marketing & Communications' segment present", "Marketing & Communications" in body)
    check("Breadcrumb: skill slug segment present", "email-newsletter-creator" in body)
    p.close()
