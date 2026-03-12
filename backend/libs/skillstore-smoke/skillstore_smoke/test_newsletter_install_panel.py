"""email-newsletter-creator install panel tabs."""
from .helpers import BASE_URL, NEWSLETTER_DIRECT_URL, new_page, check, fail, PWTimeout


def run(browser):
    print("\n── email-newsletter-creator: install panel ───────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}{NEWSLETTER_DIRECT_URL}", wait_until="networkidle")
    body = p.inner_text("body")
    check("'Add to Claude' install panel heading present", "Add to Claude" in body)
    check("Tab 'Desktop & Web' present", "Desktop & Web" in body)
    check("Tab 'Claude Code' present", "Claude Code" in body)
    check("Tab 'Project File' present", "Project File" in body)
    check("Default tab copy button present", "Copy skill to clipboard" in body)
    try:
        p.locator("text=Claude Code").first.click(timeout=6000)
        p.wait_for_timeout(500)
        body = p.inner_text("body")
        check("Claude Code tab shows curl command", "curl" in body.lower() or "Copy command" in body)
    except PWTimeout:
        fail("Claude Code tab did not respond to click")
    try:
        p.locator("text=Project File").first.click(timeout=6000)
        p.wait_for_timeout(500)
        body = p.inner_text("body")
        check("Project File tab shows download button", "Download" in body)
    except PWTimeout:
        fail("Project File tab did not respond to click")
    p.close()
