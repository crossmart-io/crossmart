"""Turns the generated client's responses into return values or exceptions."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any, Final, TypeVar

import httpx

from ._constants import HTTP_ERROR_STATUS_THRESHOLD
from ._generated.types import Response
from .errors import (
    CrossmartAPIError,
    CrossmartConnectionError,
    CrossmartError,
    api_error_from_response,
)

T = TypeVar("T")

_EMPTY_RESPONSE_MESSAGE: Final = "The API answered {status} without the expected body."
_UNEXPECTED_BODY_MESSAGE: Final = "The API answered {status} with a body that is not a {expected}."


def ensure_success(response: Response[Any]) -> None:
    """Raises the matching :class:`~crossmart.errors.CrossmartAPIError` for an error status."""
    if response.status_code >= HTTP_ERROR_STATUS_THRESHOLD:
        raise _api_error(response)


def unwrap(response: Response[T]) -> T:
    """The parsed body of a successful response."""
    ensure_success(response)
    if response.parsed is None:
        raise CrossmartError(_EMPTY_RESPONSE_MESSAGE.format(status=response.status_code))
    return response.parsed


def unwrap_as(response: Response[Any], expected: type[T]) -> T:
    """The parsed body, for operations whose generated type also lists an error model."""
    parsed = unwrap(response)
    if not isinstance(parsed, expected):
        raise CrossmartError(
            _UNEXPECTED_BODY_MESSAGE.format(status=response.status_code, expected=expected.__name__)
        )
    return parsed


@contextmanager
def translate_transport_errors() -> Iterator[None]:
    """Raises :class:`~crossmart.errors.CrossmartConnectionError` when the API cannot be reached."""
    try:
        yield
    except httpx.TransportError as error:
        raise CrossmartConnectionError(str(error) or type(error).__name__) from error


def _api_error(response: Response[Any]) -> CrossmartAPIError:
    return api_error_from_response(
        int(response.status_code), response.content, dict(response.headers)
    )
