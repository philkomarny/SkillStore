"""/pricing page."""
from .helpers import BASE_URL, new_page, check


def run(browser):
    print("\n── /pricing ──────────────────────────────────────")
    p = new_page(browser)
    p.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
    body = p.inner_text("body")
    check("Page loads without 404", "404" not in p.title().lower())
    check("Has pricing content", len(body) > 200)
    p.close()
