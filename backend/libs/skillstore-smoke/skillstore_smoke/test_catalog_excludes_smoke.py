"""Catalog exclusion: verify __smoke-test__ slug never appears in skill listing.

Regression guard ensuring the dedicated test slug used by #42 (clap lifecycle)
cannot leak into the public catalog served by esm-live-list-skills (#43).

https://github.com/philkomarny/SkillStore/issues/43
https://github.com/philkomarny/SkillStore/issues/42
"""

from .helpers import check, fail, ok

LIST_ENDPOINT = "https://p302y68q3d.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_skills_get"

SMOKE_SLUG = "__smoke-test__"


def run(browser):
    print("\n── Catalog excludes __smoke-test__ (#43) ───")

    ctx = browser.new_context()
    page = ctx.new_page()
    page.set_default_timeout(30000)

    try:
        # ── [1/3] Fetch full catalog ──
        print("\n  [1/3] Fetch skill catalog via Lambda")
        resp = page.request.get(LIST_ENDPOINT)
        check("GET list-skills returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Cannot continue without catalog response")
            return

        entries = resp.json()
        check("Response is a non-empty array", isinstance(entries, list) and len(entries) > 0, f"type={type(entries).__name__} len={len(entries) if isinstance(entries, list) else 'N/A'}")
        if not isinstance(entries, list) or len(entries) == 0:
            fail("Empty or invalid catalog response")
            return

        # ── [2/3] Assert __smoke-test__ not in catalog ──
        print(f"\n  [2/3] Assert {SMOKE_SLUG} not in catalog")
        slugs = [e.get("slug", "") for e in entries]
        print(f"    total skills in catalog: {len(slugs)}")
        check(
            f"'{SMOKE_SLUG}' not in catalog slugs",
            SMOKE_SLUG not in slugs,
            f"FOUND {SMOKE_SLUG} in catalog — test slug leaked!",
        )

        # ── [3/3] Catalog health checks ──
        print("\n  [3/3] Catalog health checks")
        check("At least 50 skills in catalog", len(entries) >= 50, f"got {len(entries)}")
        empty_slugs = [e for e in entries if not e.get("slug")]
        check("Every entry has a non-empty slug", len(empty_slugs) == 0, f"{len(empty_slugs)} entries missing slug")

        print()
        ok("Catalog exclusion: __smoke-test__ not in listing, catalog healthy")

    finally:
        page.close()
        ctx.close()
