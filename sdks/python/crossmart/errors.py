"""Exceptions raised by the SDK.

Every failure the API reports raises a :class:`CrossmartAPIError`, or one of its subclasses for the
statuses callers usually handle differently::

    from crossmart import Crossmart, NotFoundError, PlanLimitError

    client = Crossmart()
    try:
        client.products.get("4f6c...")
    except NotFoundError:
        ...
    except PlanLimitError as error:
        print(error.code, error.feature, error.limit)
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from http import HTTPStatus
from typing import Any, Final

from ._constants import MESSAGE_SEPARATOR

_MESSAGE_FIELD: Final = "message"
_CODE_FIELD: Final = "code"
_ERROR_FIELD: Final = "error"
_UNKNOWN_ERROR_MESSAGE: Final = "Unknown error"


class CrossmartError(Exception):
    """Base class of every exception the SDK raises."""


class CrossmartConfigurationError(CrossmartError):
    """The client is missing something it needs, such as credentials or a workspace id."""


class CrossmartConnectionError(CrossmartError):
    """The API could not be reached, or did not answer in time."""


class CrossmartAPIError(CrossmartError):
    """The API answered with an error status.

    Attributes:
        status: The HTTP status code, such as ``404``.
        message: What went wrong, as the API explains it. Validation messages are joined
            with ``"; "``.
        code: A machine-readable reason when the API gives one, such as ``"plan_limit_reached"``.
            Compare it with :class:`crossmart.models.EntitlementErrorCode`.
        error: The HTTP reason phrase the API sent, such as ``"Not Found"``.
        body: The decoded JSON body, or ``None`` when the body was not JSON.
        headers: The response headers.

    """

    def __init__(
        self,
        status: int,
        message: str,
        *,
        code: str | None = None,
        error: str | None = None,
        body: Mapping[str, Any] | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        super().__init__(f"{status} {message}")
        self.status = status
        self.message = message
        self.code = code
        self.error = error
        self.body = body
        self.headers: Mapping[str, str] = headers or {}


class BadRequestError(CrossmartAPIError):
    """400: the request was invalid, for example a field failed validation."""


class AuthenticationError(CrossmartAPIError):
    """401: the API key or access token is missing, wrong, revoked or expired."""


class PlanLimitError(CrossmartAPIError):
    """402: the organization's plan does not allow the action. Upgrading the plan resolves it."""

    @property
    def feature(self) -> str | None:
        """The plan feature that ran out, such as ``"active_listings"``."""
        return _string_field(self.body, "feature")

    @property
    def plan(self) -> str | None:
        """The code of the organization's plan, such as ``"starter"``."""
        return _string_field(self.body, "plan")

    @property
    def limit(self) -> int | None:
        """The plan's limit for the feature. ``None`` means unlimited or not reported."""
        return _int_field(self.body, "limit")

    @property
    def usage(self) -> int | None:
        """How much of the feature the organization uses now."""
        return _int_field(self.body, "usage")


class PermissionDeniedError(CrossmartAPIError):
    """403: the caller's role lacks the permission the route needs."""


class NotFoundError(CrossmartAPIError):
    """404: the resource does not exist, or the caller is not in its workspace."""


class ConflictError(CrossmartAPIError):
    """409: the request conflicts with the resource's state, such as a duplicate handle or SKU."""


class RateLimitError(CrossmartAPIError):
    """429: too many requests. Idempotent requests were already retried before this was raised."""


class ServerError(CrossmartAPIError):
    """5xx: the API or one of its upstream providers failed."""


_ERRORS_BY_STATUS: Final[Mapping[int, type[CrossmartAPIError]]] = {
    HTTPStatus.BAD_REQUEST: BadRequestError,
    HTTPStatus.UNAUTHORIZED: AuthenticationError,
    HTTPStatus.PAYMENT_REQUIRED: PlanLimitError,
    HTTPStatus.FORBIDDEN: PermissionDeniedError,
    HTTPStatus.NOT_FOUND: NotFoundError,
    HTTPStatus.CONFLICT: ConflictError,
    HTTPStatus.TOO_MANY_REQUESTS: RateLimitError,
}


def api_error_from_response(
    status: int, content: bytes, headers: Mapping[str, str] | None = None
) -> CrossmartAPIError:
    """Builds the exception matching an error response.

    The API answers errors in NestJS's shape, ``{"statusCode", "message", "error"}``, where
    ``message`` is a string or a list of validation messages, plus ``code`` and details on some
    errors such as plan limits.
    """
    body = _decode_json_object(content)
    error_class = _error_class_for(status)
    return error_class(
        status,
        _message_from(status, body, content),
        code=_string_field(body, _CODE_FIELD),
        error=_string_field(body, _ERROR_FIELD),
        body=body,
        headers=headers,
    )


def _error_class_for(status: int) -> type[CrossmartAPIError]:
    if status >= HTTPStatus.INTERNAL_SERVER_ERROR:
        return ServerError
    return _ERRORS_BY_STATUS.get(status, CrossmartAPIError)


def _decode_json_object(content: bytes) -> dict[str, Any] | None:
    try:
        decoded = json.loads(content)
    except ValueError:
        return None
    return decoded if isinstance(decoded, dict) else None


def _message_from(status: int, body: Mapping[str, Any] | None, content: bytes) -> str:
    message = body.get(_MESSAGE_FIELD) if body else None
    if isinstance(message, list):
        return MESSAGE_SEPARATOR.join(str(part) for part in message)
    if isinstance(message, str) and message:
        return message
    text = content.decode(errors="replace").strip()
    return text or _reason_phrase(status)


def _reason_phrase(status: int) -> str:
    try:
        return HTTPStatus(status).phrase
    except ValueError:
        return _UNKNOWN_ERROR_MESSAGE


def _string_field(body: Mapping[str, Any] | None, name: str) -> str | None:
    value = body.get(name) if body else None
    return value if isinstance(value, str) else None


def _int_field(body: Mapping[str, Any] | None, name: str) -> int | None:
    value = body.get(name) if body else None
    return int(value) if isinstance(value, int | float) and not isinstance(value, bool) else None
