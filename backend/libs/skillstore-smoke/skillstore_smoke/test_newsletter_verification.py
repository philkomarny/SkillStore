"""email-newsletter-creator verification badge."""
from .helpers import BASE_URL, NEWSLETTER_DIRECT_URL, new_page, check


def run(browser):
    print("\n── email-newsletter-creator: verification badge ──")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("'Verification' meta label present", "Verification" in body)
    check("'Expert Verified' badge shown (level 2)", "Expert Verified" in body)
    p.close()
