"""email-newsletter-creator via category click."""
from .helpers import BASE_URL, NEWSLETTER_SLUG, NEWSLETTER_CATEGORY, new_page, check, fail, PWTimeout


def run(browser):
    print("\n── email-newsletter-creator: category → click ────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills/{NEWSLETTER_CATEGORY}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Category page loaded", "marketing" in body.lower() or "communication" in body.lower())
    try:
        p.locator(f"text={NEWSLETTER_SLUG}").first.click(timeout=8000)
        p.wait_for_url(f"**/{NEWSLETTER_SLUG}", timeout=8000)
        body = p.inner_text("body")
        check("Navigated to skill detail", NEWSLETTER_SLUG in p.url)
        check("Content rendered", len(body) > 500, f"{len(body)} chars")
    except PWTimeout:
        fail("Could not click skill in category listing")
    p.close()
