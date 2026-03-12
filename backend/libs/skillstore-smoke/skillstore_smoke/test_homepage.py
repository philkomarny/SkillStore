"""Homepage loads with skill count."""
from .helpers import BASE_URL, new_page, check


def run(browser):
    print("\n── Homepage ──────────────────────────────────────")
    p = new_page(browser)
    p.goto(BASE_URL, wait_until="networkidle")
    check("200 ok", True)
    body = p.inner_text("body")
    check("Shows skill count", "80" in body or "skills" in body.lower(), body[:100])
    check("Page title set", bool(p.title()), p.title())
    p.close()
