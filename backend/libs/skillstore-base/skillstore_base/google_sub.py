#!/usr/bin/env python
"""Validate a Google OAuth subject ID (the ``sub`` claim from a Google ID token).

Google's ``sub`` field is the stable, unique identifier for a Google account.
It is a numeric string — digits only — typically around 21 characters long.
The OpenID Connect spec (which Google implements) caps it at 255 ASCII chars.

References:
    https://github.com/febelabs/skillflow/issues/140
    https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
    https://openid.net/specs/openid-connect-core-1_0.html
"""

# https://github.com/febelabs/skillflow/issues/140
_SENTINEL_VALUES: frozenset[str] = frozenset({
    "null",
    "undefined",
    "none",
    "anonymous",
    "unknown",
})

# OIDC spec hard ceiling; Google does not document a tighter bound.
_MAX_LENGTH: int = 255

# Practical minimum — Google sub values are observed to be 15+ digits.
# Set conservatively to avoid false rejections if Google shortens them.
_MIN_LENGTH: int = 6


def validate_google_sub(sub: str) -> str | None:
    """Validate a Google OAuth subject ID.

    https://github.com/febelabs/skillflow/issues/140

    Args:
        sub: The ``user_id`` value received from the caller (already stripped).

    Returns:
        None if the value is valid.
        An error message string if the value is invalid — caller should return
        this message as a 400 response body.
    """
    if not sub:
        return "Missing required parameter: 'user_id'"

    if sub.lower() in _SENTINEL_VALUES:
        return f"Invalid user_id: '{sub}' is a sentinel value, not a real Google subject ID"

    if not sub.isdigit():
        return f"Invalid user_id: Google subject IDs are numeric strings; got '{sub}'"

    if len(sub) < _MIN_LENGTH:
        return f"Invalid user_id: too short ({len(sub)} chars); minimum is {_MIN_LENGTH}"

    if len(sub) > _MAX_LENGTH:
        return f"Invalid user_id: too long ({len(sub)} chars); maximum is {_MAX_LENGTH}"

    return None
