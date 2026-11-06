"""Resolves the client's settings from arguments and environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from enum import StrEnum
from typing import Final

from ._constants import (
    API_PATH_PREFIX,
    BEARER_SCHEME,
    DEFAULT_BASE_URL,
    EnvironmentVariable,
    Header,
)
from ._retry import RetryPolicy
from .errors import CrossmartConfigurationError

_MISSING_CREDENTIALS_MESSAGE: Final = (
    "Pass api_key or access_token, or set the CROSSMART_API_KEY or CROSSMART_ACCESS_TOKEN "
    "environment variable."
)
_CONFLICTING_CREDENTIALS_MESSAGE: Final = "Pass either api_key or access_token, not both."
_NO_PREFIX: Final = ""


class CredentialKind(StrEnum):
    """How the client authenticates."""

    API_KEY = "api_key"
    """A workspace API key, created in Settings → API keys. Sent as ``x-api-key``."""
    ACCESS_TOKEN = "access_token"  # noqa: S105 - a credential kind, not a secret
    """An OAuth access token issued to an agent. Sent as ``Authorization: Bearer``."""


@dataclass(frozen=True)
class Credentials:
    kind: CredentialKind
    secret: str

    @property
    def header_name(self) -> str:
        return Header.API_KEY if self.kind is CredentialKind.API_KEY else Header.AUTHORIZATION

    @property
    def prefix(self) -> str:
        return _NO_PREFIX if self.kind is CredentialKind.API_KEY else BEARER_SCHEME

    def __repr__(self) -> str:
        # Keeps the secret out of logs and tracebacks.
        return f"Credentials(kind={self.kind.value!r}, secret='***')"


@dataclass(frozen=True)
class ClientOptions:
    credentials: Credentials
    base_url: str
    workspace_id: str | None
    timeout: float
    retry_policy: RetryPolicy


def resolve_options(
    *,
    api_key: str | None,
    access_token: str | None,
    base_url: str | None,
    workspace_id: str | None,
    timeout: float,
    retry_policy: RetryPolicy,
) -> ClientOptions:
    """Fills each missing argument from its environment variable, then validates the result."""
    return ClientOptions(
        credentials=resolve_credentials(api_key, access_token),
        base_url=normalize_base_url(
            base_url or _env(EnvironmentVariable.BASE_URL) or DEFAULT_BASE_URL
        ),
        workspace_id=workspace_id or _env(EnvironmentVariable.WORKSPACE_ID),
        timeout=timeout,
        retry_policy=retry_policy,
    )


def resolve_credentials(api_key: str | None, access_token: str | None) -> Credentials:
    """Arguments win over environment variables. Exactly one kind of credential must remain."""
    if not api_key and not access_token:
        api_key = _env(EnvironmentVariable.API_KEY)
        access_token = _env(EnvironmentVariable.ACCESS_TOKEN)
    if api_key and access_token:
        raise CrossmartConfigurationError(_CONFLICTING_CREDENTIALS_MESSAGE)
    if api_key:
        return Credentials(CredentialKind.API_KEY, api_key)
    if access_token:
        return Credentials(CredentialKind.ACCESS_TOKEN, access_token)
    raise CrossmartConfigurationError(_MISSING_CREDENTIALS_MESSAGE)


def normalize_base_url(base_url: str) -> str:
    """Accepts the API's origin with or without the ``/api/v1`` prefix."""
    trimmed = base_url.rstrip("/")
    return trimmed.removesuffix(API_PATH_PREFIX)


def _env(variable: EnvironmentVariable) -> str | None:
    return os.environ.get(variable) or None
