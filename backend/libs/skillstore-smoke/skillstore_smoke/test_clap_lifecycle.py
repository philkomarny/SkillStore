"""Clap lifecycle: read count → post clap → verify increment → verbose check.

Unauthenticated test that exercises the item-count Lambda pair (#42):
  1. GET current clap count for __smoke-test__ slug
  2. POST a single clap event
  3. GET count again, assert exact +1 increment
  4. GET with verbose=true, assert records array present

https://github.com/philkomarny/SkillStore/issues/42
"""

from json import dumps

from .helpers import check, fail, ok

ADD_ENDPOINT = "https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post"
GET_ENDPOINT = "https://iw0ojycun6.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_item_count_get"

SMOKE_SLUG = "__smoke-test__"
COUNT_TYPE = "clap"


def run(browser):
    print("\n── Clap lifecycle (__smoke-test__ slug, #42) ───")

    ctx = browser.new_context()
    page = ctx.new_page()
    page.set_default_timeout(30000)

    try:
        # ── [1/4] Read initial count ──
        print("\n  [1/4] Read initial clap count")
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

        # ── [2/4] Post a clap ──
        print("\n  [2/4] Post a clap event")
        post_body = {
            "slug": SMOKE_SLUG,
            "count_type": COUNT_TYPE,
            "count": 1,
            "ip_address": "127.0.0.1",
        }
        resp = page.request.post(ADD_ENDPOINT, data=dumps(post_body), headers={"Content-Type": "application/json"})
        check("POST item-count returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Clap POST failed, cannot verify increment")
            return

        # ── [3/4] Read count after clap ──
        print("\n  [3/4] Verify count incremented by exactly 1")
        resp = page.request.get(get_url)
        check("GET item-count returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Cannot read count after clap")
            return

        data = resp.json()
        count_after = data.get("total", 0)
        print(f"    count_after = {count_after}")
        check(
            f"Count incremented by exactly 1 ({count_before} → {count_after})",
            count_after == count_before + 1,
            f"expected {count_before + 1}, got {count_after}",
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
        ok("Clap lifecycle: read → post → verify increment → verbose")

    finally:
        page.close()
        ctx.close()
