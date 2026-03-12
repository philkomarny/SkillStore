"""Search filters results."""
from .helpers import BASE_URL, new_page, check, fail, PWTimeout


def run(browser):
    print("\n── Search ────────────────────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/skills", wait_until="networkidle")
    try:
        search = p.locator("input[type='search'], input[placeholder*='earch'], input[placeholder*='Search']").first
        search.wait_for(timeout=5000)
        search.fill("advising")
        p.wait_for_timeout(800)
        body = p.inner_text("body")
        check("Search returns advising results", "advis" in body.lower())
    except PWTimeout:
        fail("Search input not found")
    p.close()
