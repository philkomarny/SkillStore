"""Skill metadata lifecycle: get → update → verify catalog → restore.

Exercises the skill-metadata Lambda CRUD via API Gateway using the
__smoke-test__ slug.  Validates that update-skill-metadata correctly
modifies verification_level in S3, the catalog index reflects the change,
and the original value is restored.

https://github.com/philkomarny/SkillStore/issues/41
https://github.com/philkomarny/SkillStore/issues/47
"""

from json import dumps

from .helpers import check, fail, ok

GET_ENDPOINT = "https://7sp5o27k61.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_skill_metadata_get"
UPDATE_ENDPOINT = "https://kfg8xwezk5.execute-api.us-west-2.amazonaws.com/prod/esm_live_update_skill_metadata_post"
LIST_ENDPOINT = "https://p302y68q3d.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_skills_get"

SMOKE_SLUG = "__smoke-test__"


def run(browser):
    print("\n── Skill metadata lifecycle (#41, #47) ───")

    ctx = browser.new_context()
    page = ctx.new_page()
    page.set_default_timeout(30000)

    try:
        # ── [1/5] Get current metadata ──
        print("\n  [1/5] Get current metadata for __smoke-test__")
        resp = page.request.get(f"{GET_ENDPOINT}?slug={SMOKE_SLUG}")
        check("GET metadata returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Cannot continue without metadata")
            return

        meta = resp.json()
        original_vl = meta.get("verification_level", 0)
        print(f"    current verification_level = {original_vl}")
        check("Metadata has slug field", meta.get("slug") == SMOKE_SLUG, f"slug={meta.get('slug')}")
        check("verification_level is valid (0-2)", original_vl in (0, 1, 2), f"got {original_vl}")

        # Pick a different level to toggle to
        new_vl = 1 if original_vl != 1 else 0

        # ── [2/5] Update verification_level ──
        print(f"\n  [2/5] Update verification_level: {original_vl} → {new_vl}")
        update_body = {
            "slug": SMOKE_SLUG,
            "by": "smoke-test",
            "verification_level": new_vl,
        }
        resp = page.request.post(
            UPDATE_ENDPOINT,
            data=dumps(update_body),
            headers={"Content-Type": "application/json"},
        )
        check("POST update-metadata returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status != 200:
            fail("Update failed, cannot continue")
            return

        update_result = resp.json()
        check(
            "verification_level in updated fields",
            "verification_level" in update_result.get("updated", []),
            f"updated={update_result.get('updated')}",
        )

        # ── [3/5] Verify metadata changed ──
        print("\n  [3/5] Verify metadata reflects new value")
        resp = page.request.get(f"{GET_ENDPOINT}?slug={SMOKE_SLUG}")
        check("GET metadata returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status == 200:
            meta_after = resp.json()
            check(
                f"verification_level is now {new_vl}",
                meta_after.get("verification_level") == new_vl,
                f"got {meta_after.get('verification_level')}",
            )

        # ── [4/5] Verify catalog index updated ──
        print("\n  [4/5] Verify catalog index reflects change")
        resp = page.request.get(LIST_ENDPOINT)
        check("GET list-skills returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status == 200:
            entries = resp.json()
            smoke_entries = [e for e in entries if e.get("slug") == SMOKE_SLUG]
            if smoke_entries:
                catalog_vl = smoke_entries[0].get("verificationLevel")
                check(
                    f"Catalog verificationLevel is {new_vl}",
                    catalog_vl == new_vl,
                    f"got {catalog_vl}",
                )
            else:
                # __smoke-test__ may be filtered from public catalog — that's OK
                print("    __smoke-test__ not in public catalog (expected if status != approved)")

        # ── [5/5] Restore original value ──
        print(f"\n  [5/5] Restore verification_level: {new_vl} → {original_vl}")
        restore_body = {
            "slug": SMOKE_SLUG,
            "by": "smoke-test",
            "verification_level": original_vl,
        }
        resp = page.request.post(
            UPDATE_ENDPOINT,
            data=dumps(restore_body),
            headers={"Content-Type": "application/json"},
        )
        check("Restore returns 200", resp.status == 200, f"status={resp.status}")
        if resp.status == 200:
            restore_result = resp.json()
            check(
                "verification_level in restored fields",
                "verification_level" in restore_result.get("updated", []),
                f"updated={restore_result.get('updated')}",
            )

        print()
        ok("Skill metadata lifecycle: get → update → verify catalog → restore")

    finally:
        page.close()
        ctx.close()
