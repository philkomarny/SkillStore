"""email-newsletter-creator rendered markdown content quality."""
from .helpers import BASE_URL, NEWSLETTER_DIRECT_URL, new_page, check


def run(browser):
    print("\n── email-newsletter-creator: content quality ─────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("H1 title 'Email Newsletter Creator' rendered", "Email Newsletter Creator" in body)
    check("'When to Activate' section present", "When to Activate" in body)
    check("'Input Requirements' section present", "Input Requirements" in body)
    check("'Anti-Patterns' section present", "Anti-Patterns" in body)
    check("Substantial rendered content (>5000 chars)", len(body) > 5000, f"{len(body)} chars")
    p.close()
