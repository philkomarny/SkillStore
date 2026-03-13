"""Verification level: Lambda catalog field + rendered badge on detail page.

Validates that esm-live-list-skills returns a valid verificationLevel (0–2)
for every skill, then spot-checks that the rendered detail page shows the
correct badge text.

https://github.com/philkomarny/SkillStore/issues/47
https://github.com/philkomarny/SkillStore/issues/41
"""

from .helpers import BASE_URL, check, fail, goto, ok

LIST_ENDPOINT = "https://p302y68q3d.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_skills_get"

BADGE_LABELS = {0: "Community", 1: "Bot Verified", 2: "Expert Verified"}


def run(browser):
    print("\n── Verification level (#47) ───")

    ctx = browser.new_context()
    page = ctx.new_page()
    page.set_default_timeout(30000)

    try:
        # ── [1/3] Fetch catalog and validate verificationLevel field ──
        print("\n  [1/3] Validate verificationLevel in catalog")
        resp = page.request.get(LIST_ENDPOINT)
        check("GET list-skills returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Cannot continue without catalog response")
            return

        entries = resp.json()
        check("Response is a non-empty array", isinstance(entries, list) and len(entries) > 0)
        if not isinstance(entries, list) or len(entries) == 0:
            fail("Empty or invalid catalog response")
            return

        # Every entry must have verificationLevel in {0, 1, 2}
        invalid = [e.get("slug", "?") for e in entries if e.get("verificationLevel") not in (0, 1, 2)]
        check("Every skill has valid verificationLevel (0–2)", len(invalid) == 0, f"invalid: {invalid[:5]}")

        # Group by level for reporting
        by_level = {}
        for e in entries:
            vl = e.get("verificationLevel", -1)
            by_level.setdefault(vl, []).append(e)
        for lvl in sorted(by_level):
            print(f"    level {lvl} ({BADGE_LABELS.get(lvl, '?')}): {len(by_level[lvl])} skills")

        # ── [2/3] Pick a skill and load detail page ──
        # Prefer level 2, fall back to whatever exists
        test_skill = None
        for preferred in (2, 1, 0):
            if preferred in by_level and by_level[preferred]:
                test_skill = by_level[preferred][0]
                break

        if not test_skill:
            fail("No skill found to spot-check")
            return

        slug = test_skill["slug"]
        category = test_skill["category"]
        expected_level = test_skill["verificationLevel"]
        expected_label = BADGE_LABELS[expected_level]

        print(f"\n  [2/3] Load detail page: {slug} (level {expected_level})")
        detail_url = f"{BASE_URL}/skills/{category}/{slug}"
        goto(page, detail_url)
        check("Detail page loaded", slug in page.url, f"url={page.url}")

        # ── [3/3] Assert badge text on page ──
        print(f"\n  [3/3] Assert badge text '{expected_label}' on page")
        body = page.inner_text("body")
        check(
            f"Badge label '{expected_label}' visible on detail page",
            expected_label in body,
            f"'{expected_label}' not found in page body",
        )

        print()
        ok(f"Verification level: catalog valid, detail badge correct ({expected_label})")

    finally:
        page.close()
        ctx.close()
