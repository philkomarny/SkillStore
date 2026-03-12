"""email-newsletter-creator clickable tags."""
from .helpers import BASE_URL, NEWSLETTER_DIRECT_URL, new_page, check, fail, PWTimeout


def run(browser):
    print("\n── email-newsletter-creator: tags ───────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("Tag 'email' present", "email" in body)
    check("Tag 'newsletters' present", "newsletters" in body)
    check("Tag 'drip-campaigns' present", "drip-campaigns" in body)
    check("Tag 'audience-segmentation' present", "audience-segmentation" in body)
    try:
        p.locator("a[href*='tag=email']").first.click(timeout=6000)
        p.wait_for_url("**/skills**tag**", timeout=6000)
        check("Clicking tag navigates to /skills?tag=... filter page", "skills" in p.url and "tag" in p.url)
    except PWTimeout:
        fail("Tag click did not navigate to filtered skills page")
    p.close()
