"""Shared helpers for smoke tests."""
import sys
from pathlib import Path
from playwright.sync_api import TimeoutError as PWTimeout  # noqa: F401

BASE_URL = "https://www.eduskillsmp.com"
AUTH_STATE = Path(__file__).parent.parent / "auth-state.json"
FIXTURE_DOC = Path(__file__).parent / "fixtures" / "test-doc.txt"

NEWSLETTER_SLUG = "email-newsletter-creator"
NEWSLETTER_CATEGORY = "marketing-communications"
NEWSLETTER_DIRECT_URL = f"/skills/{NEWSLETTER_CATEGORY}/{NEWSLETTER_SLUG}"

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"

failures: list[str] = []


def ok(label):
    print(f"  {PASS} {label}")


def fail(label, detail=""):
    msg = label + (f": {detail}" if detail else "")
    print(f"  {FAIL} {msg}")
    failures.append(msg)


def check(label, condition, detail=""):
    if condition:
        ok(label)
    else:
        fail(label, detail)


def new_page(browser):
    p = browser.new_page()
    p.set_default_timeout(15000)
    return p


def report_and_exit():
    print(f"\n{'─' * 50}")
    if failures:
        print(f"\033[91m{len(failures)} FAILED:\033[0m")
        for f in failures:
            print(f"  • {f}")
        sys.exit(1)
    else:
        print("\033[92mAll tests passed.\033[0m")
