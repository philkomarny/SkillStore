"""
setup_auth.py — One-time authenticated session setup for skillstore-smoke tests.

Run this script once to log in as the test user (Skyler Vance) and save the
browser session to auth-state.json. The smoke tests load that saved state to
run authenticated tests without re-logging in.

Usage:
    poetry run python setup_auth.py

Session stored in: auth-state.json (gitignored — contains cookies, never commit)
Re-run when session expires (~30 days).

Credentials are read from env vars:
    TEST_EMAIL     — test Google account email
    TEST_PASSWORD  — test Google account password

Or pass them directly when prompted.
"""
import os
import sys
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE_URL = "https://www.eduskillsmp.com"
AUTH_STATE_PATH = "auth-state.json"


def main():
    email = os.environ.get("TEST_EMAIL") or input("Test email: ").strip()
    password = os.environ.get("TEST_PASSWORD") or input("Test password: ").strip()

    if not email or not password:
        print("ERROR: email and password are required.")
        sys.exit(1)

    print(f"\nLogging in as {email} ...")
    print("A Firefox window will open. Complete any Google prompts that appear.")
    print("The window will close automatically once login is confirmed.\n")

    with sync_playwright() as pw:
        # Non-headless so Google doesn't block the login
        browser = pw.firefox.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(60000)

        # 1. Go to the site and click Sign in
        page.goto(BASE_URL, wait_until="networkidle")

        try:
            page.locator("text=Sign in").first.click(timeout=8000)
        except PWTimeout:
            print("ERROR: Could not find 'Sign in' button on homepage.")
            browser.close()
            sys.exit(1)

        # 2. Expect redirect to next-auth signin page, then click Google
        try:
            page.wait_for_url("**/auth/signin**", timeout=10000)
        except PWTimeout:
            pass  # Some setups go straight to Google

        try:
            page.locator("text=Sign in with Google").first.click(timeout=8000)
        except PWTimeout:
            print("ERROR: Could not find 'Sign in with Google' button.")
            browser.close()
            sys.exit(1)

        # 3. Google login — fill email
        # Wait for Google domain (pattern covers /v3/ and other paths)
        try:
            page.wait_for_function(
                "() => location.hostname.includes('accounts.google.com')",
                timeout=15000,
            )
            print("  → Google login page reached")
        except PWTimeout:
            print("  → Timed out waiting for Google — proceeding anyway")

        try:
            # Email field — click first so focus is set, then fill
            email_input = page.locator("input[type='email']")
            email_input.wait_for(state="visible", timeout=10000)
            email_input.click()
            email_input.fill(email)
            page.keyboard.press("Enter")

            # Password field — use named field to avoid matching the hidden duplicate
            password_input = page.locator("input[name='Passwd']")
            password_input.wait_for(state="visible", timeout=15000)
            password_input.click()
            password_input.fill(password)
            page.keyboard.press("Enter")

            print("  → Credentials submitted, waiting for redirect ...")
        except PWTimeout:
            print("  → Google form not found — may need manual completion in the open window.")
            print("     Complete the login manually, then press Enter here to continue.")
            input()

        # 4. Wait for redirect back to eduskillsmp.com
        try:
            page.wait_for_url(f"{BASE_URL}/**", timeout=30000)
            print("  → Redirected back to eduskillsmp.com")
        except PWTimeout:
            print("  → Timeout waiting for redirect. If you see the site, press Enter to continue.")
            input()

        # 5. Confirm we're logged in (nav shows something other than "Sign in")
        page.wait_for_load_state("networkidle")
        body = page.inner_text("body")

        if "Sign in" in body and "Sign out" not in body and "Refinery" not in body:
            print("\nWARNING: Page still shows 'Sign in' — login may not have completed.")
            print("If you are logged in, press Enter to save the session anyway.")
            input()
        else:
            print("  → Login confirmed")

        # 6. Save session state
        context.storage_state(path=AUTH_STATE_PATH)
        print(f"\nSession saved to {AUTH_STATE_PATH}")
        print("You can now run: poetry run python smoke_test.py")

        browser.close()


if __name__ == "__main__":
    main()
