"""Retries with exponential backoff, as httpx transports.

Only idempotent methods are retried: on a retryable status (429 and 5xx) and when the connection
fails. A ``Retry-After`` header, in seconds or as an HTTP date, sets the wait when present.
"""

from __future__ import annotations

import asyncio
import random
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime

import httpx

from ._constants import (
    BACKOFF_JITTER_RATIO,
    BACKOFF_MULTIPLIER,
    DEFAULT_INITIAL_BACKOFF_SECONDS,
    DEFAULT_MAX_BACKOFF_SECONDS,
    DEFAULT_MAX_RETRIES,
    IDEMPOTENT_METHODS,
    MAX_RETRY_AFTER_SECONDS,
    RETRYABLE_STATUS_CODES,
    Header,
)

_RETRYABLE_TRANSPORT_ERRORS = (httpx.ConnectError, httpx.ConnectTimeout)
"""Failures where the request never reached the server, so retrying cannot duplicate it."""


@dataclass(frozen=True)
class RetryPolicy:
    """How the client retries failed idempotent requests.

    Attributes:
        max_retries: Retries after the first attempt. ``0`` disables retries.
        initial_backoff: Seconds before the first retry; each retry doubles it.
        max_backoff: The longest wait between two attempts when the API gives no ``Retry-After``.

    """

    max_retries: int = DEFAULT_MAX_RETRIES
    initial_backoff: float = DEFAULT_INITIAL_BACKOFF_SECONDS
    max_backoff: float = DEFAULT_MAX_BACKOFF_SECONDS
    retryable_statuses: frozenset[int] = field(default=RETRYABLE_STATUS_CODES)

    def allows_retry(self, request: httpx.Request, attempt: int) -> bool:
        """Whether the request may be sent again after ``attempt`` failed attempts."""
        return attempt <= self.max_retries and request.method in IDEMPOTENT_METHODS

    def should_retry(self, request: httpx.Request, response: httpx.Response, attempt: int) -> bool:
        """Whether a response with a retryable status should be retried."""
        return response.status_code in self.retryable_statuses and self.allows_retry(
            request, attempt
        )

    def delay(self, attempt: int, response: httpx.Response | None = None) -> float:
        """Seconds to wait before the next attempt."""
        retry_after = _retry_after_seconds(response) if response is not None else None
        if retry_after is not None:
            return retry_after
        return self._backoff(attempt)

    def _backoff(self, attempt: int) -> float:
        exponential = self.initial_backoff * BACKOFF_MULTIPLIER ** (attempt - 1)
        capped = min(exponential, self.max_backoff)
        jitter = random.uniform(0, capped * BACKOFF_JITTER_RATIO)  # noqa: S311 - not cryptographic
        return capped - jitter


def _retry_after_seconds(response: httpx.Response) -> float | None:
    """The wait a ``Retry-After`` header asks for, capped, or ``None`` without a usable one."""
    value = response.headers.get(Header.RETRY_AFTER)
    if not value:
        return None
    seconds = _parse_retry_after(value.strip())
    if seconds is None:
        return None
    return min(max(seconds, 0.0), MAX_RETRY_AFTER_SECONDS)


def _parse_retry_after(value: str) -> float | None:
    try:
        return float(value)
    except ValueError:
        pass
    try:
        retry_at = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    return (retry_at - datetime.now(UTC)).total_seconds()


def blocking_sleep(seconds: float) -> None:
    """The wait between synchronous attempts. Looked up on each call, so tests can replace it."""
    time.sleep(seconds)


async def async_sleep(seconds: float) -> None:
    """The wait between asynchronous attempts. Looked up on each call, so tests can replace it."""
    await asyncio.sleep(seconds)


class RetryTransport(httpx.BaseTransport):
    """Wraps a transport and retries idempotent requests according to a :class:`RetryPolicy`."""

    def __init__(
        self,
        wrapped: httpx.BaseTransport,
        policy: RetryPolicy,
        sleep: Callable[[float], None] | None = None,
    ) -> None:
        self._wrapped = wrapped
        self._policy = policy
        self._custom_sleep = sleep

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        attempt = 1
        while True:
            try:
                response = self._wrapped.handle_request(request)
            except _RETRYABLE_TRANSPORT_ERRORS:
                if not self._policy.allows_retry(request, attempt):
                    raise
                self._sleep(self._policy.delay(attempt))
            else:
                if not self._policy.should_retry(request, response, attempt):
                    return response
                response.close()
                self._sleep(self._policy.delay(attempt, response))
            attempt += 1

    def _sleep(self, seconds: float) -> None:
        (self._custom_sleep or blocking_sleep)(seconds)

    def close(self) -> None:
        self._wrapped.close()


class AsyncRetryTransport(httpx.AsyncBaseTransport):
    """The asynchronous counterpart of :class:`RetryTransport`."""

    def __init__(
        self,
        wrapped: httpx.AsyncBaseTransport,
        policy: RetryPolicy,
        sleep: Callable[[float], Awaitable[None]] | None = None,
    ) -> None:
        self._wrapped = wrapped
        self._policy = policy
        self._custom_sleep = sleep

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        attempt = 1
        while True:
            try:
                response = await self._wrapped.handle_async_request(request)
            except _RETRYABLE_TRANSPORT_ERRORS:
                if not self._policy.allows_retry(request, attempt):
                    raise
                await self._sleep(self._policy.delay(attempt))
            else:
                if not self._policy.should_retry(request, response, attempt):
                    return response
                await response.aclose()
                await self._sleep(self._policy.delay(attempt, response))
            attempt += 1

    async def _sleep(self, seconds: float) -> None:
        await (self._custom_sleep or async_sleep)(seconds)

    async def aclose(self) -> None:
        await self._wrapped.aclose()
