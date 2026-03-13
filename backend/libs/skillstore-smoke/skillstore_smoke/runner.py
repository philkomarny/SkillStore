"""
Smoke test runner for https://www.eduskillsmp.com
Run: python -m skillstore_smoke.runner [test_name ...]

Examples:
  python -m skillstore_smoke.runner                       # run all
  python -m skillstore_smoke.runner test_refine_skill     # run one
  python -m skillstore_smoke.runner test_refine_skill test_homepage  # run several
"""
import sys

from playwright.sync_api import sync_playwright

from . import (
    test_homepage,
    test_skills_catalog,
    test_category_page,
    test_skill_detail,
    test_skill_detail_direct,
    test_search,
    test_how_it_works,
    test_pricing,
    test_newsletter_direct,
    test_newsletter_category_click,
    test_newsletter_search,
    test_newsletter_catalog_browse,
    test_newsletter_homepage_nav,
    test_newsletter_breadcrumb,
    test_newsletter_verification,
    test_newsletter_sidebar_meta,
    test_newsletter_tags,
    test_newsletter_install_panel,
    test_newsletter_refinery_sidebar,
    test_newsletter_content_quality,
    test_document_upload,
    test_document_upload_lifecycle,
    test_user_skill_lifecycle,
    test_context_lifecycle,
    test_refine_skill,
    test_clap_lifecycle,
    test_download_lifecycle,
    test_catalog_excludes_smoke,
    test_verification_level,
)
from .helpers import report_and_exit

ALL_TESTS = [
    test_homepage,
    test_skills_catalog,
    test_category_page,
    test_skill_detail,
    test_skill_detail_direct,
    test_search,
    test_how_it_works,
    test_pricing,
    test_newsletter_direct,
    test_newsletter_category_click,
    test_newsletter_search,
    test_newsletter_catalog_browse,
    test_newsletter_homepage_nav,
    test_newsletter_breadcrumb,
    test_newsletter_verification,
    test_newsletter_sidebar_meta,
    test_newsletter_tags,
    test_newsletter_install_panel,
    test_newsletter_refinery_sidebar,
    test_newsletter_content_quality,
    test_document_upload,
    test_document_upload_lifecycle,
    test_user_skill_lifecycle,
    test_context_lifecycle,
    test_refine_skill,
    test_clap_lifecycle,
    test_download_lifecycle,
    test_catalog_excludes_smoke,
    test_verification_level,
]


_TEST_BY_NAME = {t.__name__.rsplit(".", 1)[-1]: t for t in ALL_TESTS}


def main():
    filters = sys.argv[1:]
    if filters:
        tests = []
        for name in filters:
            name = name.removesuffix(".py")
            if name not in _TEST_BY_NAME:
                print(f"Unknown test: {name}")
                print(f"Available: {', '.join(_TEST_BY_NAME)}")
                sys.exit(2)
            tests.append(_TEST_BY_NAME[name])
    else:
        tests = ALL_TESTS

    with sync_playwright() as pw:
        browser = pw.firefox.launch(headless=True)
        try:
            for test in tests:
                test.run(browser)
        finally:
            browser.close()

    report_and_exit()


if __name__ == "__main__":
    main()
