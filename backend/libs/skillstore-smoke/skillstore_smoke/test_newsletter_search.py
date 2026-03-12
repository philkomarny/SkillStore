"""email-newsletter-creator via search."""
from .helpers import BASE_URL, NEWSLETTER_SLUG, new_page, check, fail, PWTimeout


def run(browser):
    print("\n── email-newsletter-creator: search ─────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    try:
        search = p.locator("input[type='search'], input[placeholder*='earch'], input[placeholder*='Search']").first
        search.wait_for(timeout=5000)
        search.fill("email newsletter")
        p.wait_for_timeout(800)
        body = p.inner_text("body")
        check("Search returns newsletter result", "newsletter" in body.lower() or "email" in body.lower())
        check("Slug visible in results", NEWSLETTER_SLUG in body or "email-newsletter" in body)
    except PWTimeout:
        fail("Search input not found")
    p.close()
