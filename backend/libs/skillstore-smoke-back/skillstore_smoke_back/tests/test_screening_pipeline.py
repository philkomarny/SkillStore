"""Screening pipeline smoke tests — invoke esm-live-screen-orchestrate with
realistic skill fixtures and validate the decision + audit trail.

Tests the full Step Function pipeline:
    Classify → (optional) Score → Decide → S3 audit

Each test case provides a skill markdown fixture with an expected decision
(accept / review / reject).  The orchestrator Lambda calls StartSyncExecution
on the Express Step Function, which chains the three inner Lambdas.

Run:
    cd backend/libs/skillstore-smoke-back
    make test

    # or a single test:
    poetry run pytest skillstore_smoke_back/tests/test_screening_pipeline.py -k "safe_enrollment" -v -s

Related: https://github.com/philkomarny/SkillStore/issues/40
"""

from __future__ import annotations

import json
from typing import Any

import pytest

from skillstore_smoke_back.fixtures.skills import (
    ALL_FIXTURES,
    BORDERLINE_SKILL,
    DATA_EXFILTRATION,
    HARMFUL_INSTRUCTIONS,
    IMPERSONATION,
    PROMPT_INJECTION,
    SAFE_ENROLLMENT_SKILL,
    SAFE_IT_SKILL,
)

_LAMBDA_NAME = "esm-live-screen-orchestrate"
_TEST_AUTHOR = "999000000000000000001"  # https://github.com/philkomarny/SkillStore/issues/27


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_body(result: dict[str, Any]) -> dict[str, Any]:
    """Extract the JSON body from an API Gateway-style Lambda response."""
    assert result.get("statusCode") == 200, (
        f"Expected 200, got {result.get('statusCode')}: {result.get('body')}"
    )
    body = result.get("body", "")
    if isinstance(body, str):
        return json.loads(body)
    return body


def _invoke_screening(invoke, fixture: dict) -> dict[str, Any]:
    """Invoke the orchestrator and return the parsed screening result."""
    payload = {
        "content": fixture["content"],
        "slug": fixture["slug"],
        "author_id": _TEST_AUTHOR,
    }

    print(f"\n  Screening: {fixture['label']}")
    print(f"  Slug:      {fixture['slug']}")
    print(f"  Expected:  {fixture['expect']}")

    result = invoke(_LAMBDA_NAME, payload)
    body = _parse_body(result)

    print(f"  Decision:  {body.get('decision')}")
    print(f"  Audit key: {body.get('audit_key', 'n/a')}")

    return body


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

class TestScreeningPipeline:
    """End-to-end screening pipeline tests via the orchestrator Lambda.

    Each test sends a skill fixture through the full pipeline and asserts
    the expected decision.  Tests are independent and can run in any order.
    """

    def test_safe_enrollment_skill(self, invoke):
        """Legitimate enrollment skill should be accepted."""
        body = _invoke_screening(invoke, SAFE_ENROLLMENT_SKILL)
        assert body["decision"] == "accept", f"Expected accept, got: {body}"
        assert "audit_key" in body

    def test_safe_it_skill(self, invoke):
        """Legitimate IT operations skill should be accepted."""
        body = _invoke_screening(invoke, SAFE_IT_SKILL)
        assert body["decision"] == "accept", f"Expected accept, got: {body}"
        assert "audit_key" in body

    def test_prompt_injection_rejected(self, invoke):
        """Prompt injection attack should be rejected."""
        body = _invoke_screening(invoke, PROMPT_INJECTION)
        assert body["decision"] == "reject", f"Expected reject, got: {body}"
        assert "audit_key" in body

    def test_data_exfiltration_rejected(self, invoke):
        """Data exfiltration attempt should be rejected."""
        body = _invoke_screening(invoke, DATA_EXFILTRATION)
        assert body["decision"] == "reject", f"Expected reject, got: {body}"
        assert "audit_key" in body

    def test_impersonation_rejected(self, invoke):
        """Impersonation of institutional authority should be rejected."""
        body = _invoke_screening(invoke, IMPERSONATION)
        assert body["decision"] == "reject", f"Expected reject, got: {body}"
        assert "audit_key" in body

    def test_borderline_skill_accepted(self, invoke):
        """Aggressive but non-malicious skill should be accepted."""
        body = _invoke_screening(invoke, BORDERLINE_SKILL)
        assert body["decision"] == "accept", f"Expected accept, got: {body}"
        assert "audit_key" in body

    def test_harmful_instructions_rejected(self, invoke):
        """Academic fraud instructions should be rejected."""
        body = _invoke_screening(invoke, HARMFUL_INSTRUCTIONS)
        assert body["decision"] == "reject", f"Expected reject, got: {body}"
        assert "audit_key" in body


# ---------------------------------------------------------------------------
# Parametrized sweep — runs all fixtures as a matrix
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "fixture",
    ALL_FIXTURES,
    ids=[f["slug"] for f in ALL_FIXTURES],
)
def test_screening_decision_matches_expectation(invoke, fixture):
    """Parametrized: every fixture should produce its expected decision."""
    body = _invoke_screening(invoke, fixture)
    assert body["decision"] == fixture["expect"], (
        f"[{fixture['slug']}] Expected '{fixture['expect']}', got '{body['decision']}'"
    )
