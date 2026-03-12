"""email-newsletter-creator via homepage navigation."""
from .helpers import BASE_URL, NEWSLETTER_SLUG, new_page, check, fail, PWTimeout


def run(browser):
    print("\n── email-newsletter-creator: homepage → catalog → skill ──")
    p = new_page(browser)
    p.goto(BASE_URL, wait_until="networkidle")
    try:
        p.locator("a[href='/skills'], a[href*='skills']").first.click(timeout=8000)
        p.wait_for_url("**/skills**", timeout=8000)
        body = p.inner_text("body")
        check("Reached skills catalog from homepage", "/skills" in p.url)
        check("Newsletter skill accessible from catalog", "newsletter" in body.lower() or NEWSLETTER_SLUG in body)
    except PWTimeout:
        fail("Could not navigate to skills from homepage")
    p.close()
