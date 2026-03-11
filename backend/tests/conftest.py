"""Pytest configuration and fixtures for SkillStore Lambda integration tests.

This module provides fixtures for invoking AWS Lambda functions.
Tests run against actual deployed Lambdas (not mocked).
"""

from __future__ import annotations

import json
import os
from typing import Any, Callable

import boto3
import pytest


@pytest.fixture(scope="session")
def lambda_client():
    """Create a boto3 Lambda client.

    Uses AWS credentials from environment or ~/.aws/credentials.
    Region defaults to us-west-2 (skillflow project region).
    Profile defaults to transcriptiq_lambdaserviceuser unless AWS_PROFILE is set.
    """
    region = os.environ.get("AWS_REGION", "us-west-2")
    profile = os.environ.get("AWS_PROFILE", "transcriptiq_lambdaserviceuser")

    session = boto3.Session(profile_name=profile, region_name=region)
    return session.client("lambda")


@pytest.fixture(scope="session")
def invoke_lambda(lambda_client) -> Callable[[str, dict], dict]:
    """Factory fixture for invoking Lambda functions.

    Returns a callable that invokes a Lambda and returns the parsed response.

    Usage:
        def test_my_lambda(invoke_lambda):
            result = invoke_lambda("my-function-name", {"key": "value"})
            assert result["statusCode"] == 200
    """
    def _invoke(function_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload),
        )

        # Read and parse the response payload
        response_payload = response["Payload"].read().decode("utf-8")

        # Check for function errors
        if "FunctionError" in response:
            raise AssertionError(
                f"Lambda function error: {response['FunctionError']}\n"
                f"Response: {response_payload}"
            )

        # Parse JSON response if possible
        try:
            return json.loads(response_payload)
        except json.JSONDecodeError:
            return {"raw": response_payload}

    return _invoke


@pytest.fixture(scope="session")
def invoke_lambda_async(lambda_client) -> Callable[[str, dict], str]:
    """Factory fixture for async Lambda invocation (fire-and-forget).

    Returns the request ID for tracking.

    Usage:
        def test_async_lambda(invoke_lambda_async):
            request_id = invoke_lambda_async("my-function", {"key": "value"})
            assert request_id  # Invocation was accepted
    """
    def _invoke_async(function_name: str, payload: dict[str, Any]) -> str:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="Event",
            Payload=json.dumps(payload),
        )
        return response["ResponseMetadata"]["RequestId"]

    return _invoke_async
