"""email-newsletter-creator refinery sidebar."""
from .helpers import BASE_URL, NEWSLETTER_DIRECT_URL, new_page, check


def run(browser):
    print("\n── email-newsletter-creator: refinery sidebar ────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("'Personalize This Skill' heading present", "Personalize This Skill" in body)
    check("'Your Refinery' reference present", "Your Refinery" in body)
    check("'Sign in to Add' button present (unauthenticated)", "Sign in to Add" in body)
    p.close()
