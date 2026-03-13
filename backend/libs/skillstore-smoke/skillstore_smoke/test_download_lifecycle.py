"""Download lifecycle: read count → post 3 downloads → verify increment.

Unauthenticated test that exercises the item-count Lambda pair for downloads (#44):
  1. GET current download count for __smoke-test__ slug
  2. POST three download events (one per install method: desktop, claude-code, project-file)
  3. GET count again, assert exact +3 increment
  4. GET with verbose=true, assert records array present

https://github.com/philkomarny/SkillStore/issues/44
"""

from json import dumps

from .helpers import check, fail, ok

ADD_ENDPOINT = "https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post"
GET_ENDPOINT = "https://iw0ojycun6.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_item_count_get"

SMOKE_SLUG = "__smoke-test__"
COUNT_TYPE = "download"

# The three install methods from the InstallPanel tabs
INSTALL_METHODS = ["desktop-web", "claude-code", "project-file"]


def run(browser):
    print("\n── Download lifecycle (__smoke-test__ slug, #44) ───")

    ctx = browser.new_context()
    page = ctx.new_page()
    page.set_default_timeout(30000)

    try:
        # ── [1/4] Read initial count ──
        print("\n  [1/4] Read initial download count")
        get_url = f"{GET_ENDPOINT}?slug={SMOKE_SLUG}&count_type={COUNT_TYPE}"
        resp = page.request.get(get_url)
        check("GET item-count returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Cannot continue without initial count")
            return

        data = resp.json()
        count_before = data.get("total", 0)
        check("Initial count is an integer", isinstance(count_before, int), f"got {type(count_before)}")
        print(f"    count_before = {count_before}")

        # ── [2/4] Post 3 download events (one per install method) ──
        print("\n  [2/4] Post download events for each install method")
        for method in INSTALL_METHODS:
            post_body = {
                "slug": SMOKE_SLUG,
                "count_type": COUNT_TYPE,
                "count": 1,
                "ip_address": "127.0.0.1",
                "user_id": f"smoke-test-{method}",
            }
            resp = page.request.post(ADD_ENDPOINT, data=dumps(post_body), headers={"Content-Type": "application/json"})
            check(f"POST download ({method}) returns 200", resp.status == 200, f"status={resp.status}")
            if resp.status != 200:
                fail(f"Download POST failed for {method}, cannot verify increment")
                return

        # ── [3/4] Read count after downloads ──
        print("\n  [3/4] Verify count incremented by exactly 3")
        resp = page.request.get(get_url)
        check("GET item-count returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Cannot read count after downloads")
            return

        data = resp.json()
        count_after = data.get("total", 0)
        print(f"    count_after = {count_after}")
        check(
            f"Count incremented by exactly 3 ({count_before} → {count_after})",
            count_after == count_before + 3,
            f"expected {count_before + 3}, got {count_after}",
        )

        # ── [4/4] Verbose mode ──
        print("\n  [4/4] Verify verbose mode returns records")
        verbose_url = f"{GET_ENDPOINT}?slug={SMOKE_SLUG}&count_type={COUNT_TYPE}&verbose=true"
        resp = page.request.get(verbose_url)
        check("GET verbose returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status == 200:
            data = resp.json()
            records = data.get("records", [])
            check("Verbose response includes records array", isinstance(records, list) and len(records) > 0, f"records={len(records)}")
            check("Total matches records count", data.get("total") == len(records), f"total={data.get('total')} records={len(records)}")

        print()
        ok("Download lifecycle: read → post 3 methods → verify increment → verbose")

    finally:
        page.close()
        ctx.close()
