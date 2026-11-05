"""Literals shared across the SDK."""

from __future__ import annotations

from enum import StrEnum
from typing import Final

from ._version import __version__

DEFAULT_BASE_URL: Final = "https://api.crossmart.io"
"""The hosted API. The generated operations already carry the ``/api/v1`` prefix."""

API_PATH_PREFIX: Final = "/api/v1"
"""Stripped from a ``base_url`` that includes it, so both forms work."""

DEFAULT_TIMEOUT_SECONDS: Final = 30.0
USER_AGENT: Final = f"crossmart-python/{__version__}"


class Header(StrEnum):
    """HTTP headers the SDK reads or sends."""

    API_KEY = "x-api-key"
    AUTHORIZATION = "authorization"
    USER_AGENT = "user-agent"
    RETRY_AFTER = "retry-after"


BEARER_SCHEME: Final = "Bearer"


class EnvironmentVariable(StrEnum):
    """Environment variables read when the matching argument is not given."""

    API_KEY = "CROSSMART_API_KEY"
    ACCESS_TOKEN = "CROSSMART_ACCESS_TOKEN"  # noqa: S105 - a variable name, not a secret
    BASE_URL = "CROSSMART_BASE_URL"
    WORKSPACE_ID = "CROSSMART_WORKSPACE_ID"


DEFAULT_MAX_RETRIES: Final = 2
DEFAULT_INITIAL_BACKOFF_SECONDS: Final = 0.5
DEFAULT_MAX_BACKOFF_SECONDS: Final = 8.0
MAX_RETRY_AFTER_SECONDS: Final = 60.0
"""A longer ``Retry-After`` is capped, so a misbehaving proxy cannot stall the caller for hours."""
BACKOFF_MULTIPLIER: Final = 2.0
BACKOFF_JITTER_RATIO: Final = 0.25

RETRYABLE_STATUS_CODES: Final = frozenset({429, 500, 502, 503, 504})
IDEMPOTENT_METHODS: Final = frozenset({"GET", "HEAD", "OPTIONS", "PUT", "DELETE"})
"""Methods RFC 9110 defines as idempotent. Only these are retried, so a POST never runs twice."""

HTTP_ERROR_STATUS_THRESHOLD: Final = 400
MESSAGE_SEPARATOR: Final = "; "
