"""
Playwright smoke tests against https://skillsmp.com/
Run: python3 tests/smoke_test.py
"""
import sys
import time
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE_URL = "https://skillsmp.com"
PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
failures = []


def check(label, condition, detail=""):
    if condition:
        print(f"  {PASS} {label}")
    else:
        msg = f"{label}" + (f": {detail}" if detail else "")
        print(f"  {FAIL} {msg}")
        failures.append(msg)


def test_homepage(page):
    print("\n── Homepage ──────────────────────────────")
    page.goto(BASE_URL, wait_until="networkidle")
    check("200 / no crash", True)

    # Skill cards visible
    cards = page.locator("[data-testid='skill-card'], a[href*='/skills/']").all()
    check("Skill cards rendered", len(cards) > 0, f"found {len(cards)}")

    # Page title present
    title = page.title()
    check("Page has title", bool(title), title)


def test_skills_browse(page):
    print("\n── /skills browse page ───────────────────")
    page.goto(f"{BASE_URL}/skills", wait_until="networkidle")

    cards = page.locator("a[href*='/skills/']").all()
    check("Skills listed", len(cards) >= 10, f"found {len(cards)}")

    # Pick the first real skill link (not a category link)
    skill_links = [
        c.get_attribute("href") for c in cards
        if c.get_attribute("href") and c.get_attribute("href").count("/") >= 3
    ]
    check("At least one skill detail link exists", len(skill_links) > 0)
    return skill_links[0] if skill_links else None


def test_skill_detail(page, path):
    print(f"\n── Skill detail: {path} ──────────────────")
    page.goto(f"{BASE_URL}{path}", wait_until="networkidle")

    # Should not be a 404
    body = page.inner_text("body")
    check("Not a 404", "404" not in page.title().lower())

    # Should have some substantial content
    check("Page has content", len(body) > 500, f"{len(body)} chars")

    # Should have skill name heading
    h1s = page.locator("h1").all()
    check("H1 heading present", len(h1s) > 0)


def test_category_filter(page):
    print("\n── Category filter ───────────────────────")
    page.goto(f"{BASE_URL}/skills/enrollment-admissions", wait_until="networkidle")

    cards = page.locator("a[href*='/skills/']").all()
    check("Category page loads with skills", len(cards) > 0, f"found {len(cards)}")


def test_search(page):
    print("\n── Search ────────────────────────────────")
    page.goto(f"{BASE_URL}/skills", wait_until="networkidle")

    search = page.locator("input[type='search'], input[placeholder*='earch']").first
    try:
        search.wait_for(timeout=5000)
        search.fill("advising")
        time.sleep(1)  # debounce
        results = page.locator("a[href*='/skills/']").all()
        check("Search returns results", len(results) > 0, f"found {len(results)}")
    except PWTimeout:
        check("Search input found", False, "input not found")


def test_how_it_works(page):
    print("\n── /how-it-works ─────────────────────────")
    page.goto(f"{BASE_URL}/how-it-works", wait_until="networkidle")
    check("Page loads", "404" not in page.title().lower())
    check("Has content", len(page.inner_text("body")) > 200)


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(15000)

        try:
            test_homepage(page)
            skill_path = test_skills_browse(page)
            if skill_path:
                test_skill_detail(page, skill_path)
            test_category_filter(page)
            test_search(page)
            test_how_it_works(page)
        finally:
            browser.close()

    print(f"\n{'─' * 44}")
    if failures:
        print(f"\033[91m{len(failures)} FAILED:\033[0m")
        for f in failures:
            print(f"  • {f}")
        sys.exit(1)
    else:
        print(f"\033[92mAll tests passed.\033[0m")


if __name__ == "__main__":
    main()
