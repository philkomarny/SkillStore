"""email-newsletter-creator via direct URL."""
from .helpers import BASE_URL, NEWSLETTER_SLUG, NEWSLETTER_DIRECT_URL, new_page, check


def run(browser):
    print("\n── email-newsletter-creator: direct URL ──────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Not a 404", "404" not in p.title().lower() and "not found" not in body.lower())
    check("Slug in URL", NEWSLETTER_SLUG in p.url)
    check("Has substantial content", len(body) > 500, f"{len(body)} chars")
    check("Skill name appears in page", "email" in body.lower() or "newsletter" in body.lower())
    p.close()
