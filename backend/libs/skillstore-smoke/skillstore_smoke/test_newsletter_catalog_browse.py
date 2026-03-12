"""email-newsletter-creator via catalog browse."""
from .helpers import BASE_URL, NEWSLETTER_SLUG, new_page, check


def run(browser):
    print("\n── email-newsletter-creator: catalog browse ──────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    body = p.inner_text("body")
    check("Catalog loaded", len(body) > 200)
    check("Marketing category present", "Marketing" in body or "marketing" in body)
    check("Newsletter skill visible in catalog", "newsletter" in body.lower() or NEWSLETTER_SLUG in body)
    p.close()
