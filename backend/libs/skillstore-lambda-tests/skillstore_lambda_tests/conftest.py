"""Shared pytest fixtures for backend smoke tests.

Provides Lambda invocation helpers and common test configuration.
All tests run against actual deployed Lambdas (not mocked).
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
    Region defaults to us-west-2.
    Profile defaults to transcriptiq_lambdaserviceuser unless AWS_PROFILE is set.
    """
    region = os.environ.get("AWS_REGION", "us-west-2")
    profile = os.environ.get("AWS_PROFILE", "transcriptiq_lambdaserviceuser")
    session = boto3.Session(profile_name=profile, region_name=region)
    return session.client("lambda")


@pytest.fixture(scope="session")
def invoke(lambda_client) -> Callable[[str, dict], dict]:
    """Invoke a Lambda function synchronously and return the parsed response.

    For Step Function inner Lambdas: returns the native JSON dict directly.
    For API-facing Lambdas: returns the full {statusCode, headers, body} response.

    Raises AssertionError if the Lambda itself errors (FunctionError).
    """
    def _invoke(function_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload),
        )

        response_payload = response["Payload"].read().decode("utf-8")

        if "FunctionError" in response:
            raise AssertionError(
                f"Lambda function error: {response['FunctionError']}\n"
                f"Response: {response_payload}"
            )

        try:
            return json.loads(response_payload)
        except json.JSONDecodeError:
            return {"raw": response_payload}

    return _invoke
