"""Verification of the webhooks Crossmart sends.

Every delivery is a ``POST`` whose ``Crossmart-Signature`` header signs the raw body with the
endpoint's signing secret::

    from crossmart import WebhookSignatureError, verify_webhook_signature

    try:
        event = verify_webhook_signature(raw_body, signature_header, secret)
    except WebhookSignatureError:
        ...  # answer 400 and ignore the delivery
"""

from __future__ import annotations

import hashlib
import hmac
import json
import re
import time
from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Final, TypedDict, cast

from .errors import CrossmartError

DEFAULT_TOLERANCE_SECONDS: Final = 300
"""How far the signature's timestamp may be from the current time, either way."""

_ELEMENT_SEPARATOR: Final = ","
_KEY_VALUE_SEPARATOR: Final = "="
_TIMESTAMP_KEY: Final = "t"
_SIGNATURE_SCHEME_V1: Final = "v1"
_SIGNED_PAYLOAD_SEPARATOR: Final = b"."
_ENCODING: Final = "utf-8"
_UNIX_TIMESTAMP_PATTERN: Final = re.compile(r"[0-9]+")


class WebhookHeader(StrEnum):
    """Headers of a webhook delivery. Frameworks match header names case-insensitively."""

    SIGNATURE = "crossmart-signature"
    EVENT_ID = "crossmart-event-id"
    EVENT_TYPE = "crossmart-event-type"
    DELIVERY_ID = "crossmart-delivery-id"


class WebhookEventType(StrEnum):
    """The event types Crossmart sends today. New types may be added without a major version."""

    ORDER_CREATED = "order.created"
    ORDER_UPDATED = "order.updated"
    INVENTORY_STOCK_CHANGED = "inventory.stock_changed"
    LISTING_PUBLISHED = "listing.published"
    LISTING_FAILED = "listing.failed"
    LISTING_REMOVED = "listing.removed"
    PRODUCT_CREATED = "product.created"
    PRODUCT_UPDATED = "product.updated"
    PRODUCT_DELETED = "product.deleted"
    WEBHOOK_TEST = "webhook.test"


class WebhookEvent(TypedDict):
    """The envelope of every webhook delivery.

    ``type`` is a plain string so new event types never break a handler; compare it with
    :class:`WebhookEventType`. Retries of a delivery carry the same ``id``.
    """

    id: str
    type: str
    createdAt: str
    workspaceId: str
    apiVersion: str
    data: dict[str, Any]


class WebhookSignatureFailure(StrEnum):
    """Why a webhook delivery was rejected."""

    MISSING_HEADER = "missing_header"
    MALFORMED_HEADER = "malformed_header"
    MISSING_TIMESTAMP = "missing_timestamp"
    INVALID_TIMESTAMP = "invalid_timestamp"
    MISSING_SIGNATURE = "missing_signature"
    TIMESTAMP_OUTSIDE_TOLERANCE = "timestamp_outside_tolerance"
    SIGNATURE_MISMATCH = "signature_mismatch"
    INVALID_PAYLOAD = "invalid_payload"


_FAILURE_MESSAGES: Final[dict[WebhookSignatureFailure, str]] = {
    WebhookSignatureFailure.MISSING_HEADER: "The Crossmart-Signature header is missing.",
    WebhookSignatureFailure.MALFORMED_HEADER: "The Crossmart-Signature header is malformed.",
    WebhookSignatureFailure.MISSING_TIMESTAMP: (
        "The Crossmart-Signature header has no timestamp (t=)."
    ),
    WebhookSignatureFailure.INVALID_TIMESTAMP: (
        "The Crossmart-Signature timestamp is not a Unix time in seconds."
    ),
    WebhookSignatureFailure.MISSING_SIGNATURE: (
        "The Crossmart-Signature header has no v1 signature."
    ),
    WebhookSignatureFailure.TIMESTAMP_OUTSIDE_TOLERANCE: (
        "The Crossmart-Signature timestamp is outside the tolerance."
    ),
    WebhookSignatureFailure.SIGNATURE_MISMATCH: (
        "No signature matches the payload. Check the signing secret and that the body is the "
        "raw request body."
    ),
    WebhookSignatureFailure.INVALID_PAYLOAD: "The webhook payload is not a JSON event object.",
}


class WebhookSignatureError(CrossmartError):
    """A webhook delivery failed verification. Answer it with a 400 and do not process it.

    Attributes:
        reason: Why the delivery was rejected. The message never includes the signing secret.

    """

    def __init__(self, reason: WebhookSignatureFailure) -> None:
        super().__init__(_FAILURE_MESSAGES[reason])
        self.reason = reason


@dataclass(frozen=True)
class _SignatureHeader:
    timestamp: str
    signatures: tuple[str, ...]


def verify_webhook_signature(
    payload: bytes | str,
    header: str | None,
    secret: str,
    *,
    tolerance: int = DEFAULT_TOLERANCE_SECONDS,
    now: float | None = None,
) -> WebhookEvent:
    """Verify that a webhook delivery comes from Crossmart and return its parsed event.

    Args:
        payload: The raw request body, exactly as received. A re-serialized body does not match.
        header: The value of the ``Crossmart-Signature`` header.
        secret: The endpoint's signing secret, including its ``whsec_`` prefix.
        tolerance: How far the signature's timestamp may be from ``now``, in seconds.
        now: The current Unix time. Defaults to the system clock; pass one in tests.

    Raises:
        WebhookSignatureError: The header is missing or malformed, the timestamp is outside the
            tolerance, no signature matches, or the body is not a JSON object.

    """
    parsed = _parse_header(header)
    _check_tolerance(int(parsed.timestamp), time.time() if now is None else now, tolerance)
    body = payload.encode(_ENCODING) if isinstance(payload, str) else payload
    signed_payload = parsed.timestamp.encode(_ENCODING) + _SIGNED_PAYLOAD_SEPARATOR + body
    expected = hmac.new(secret.encode(_ENCODING), signed_payload, hashlib.sha256).hexdigest()
    if not any(_signatures_match(expected, signature) for signature in parsed.signatures):
        raise WebhookSignatureError(WebhookSignatureFailure.SIGNATURE_MISMATCH)
    return _parse_event(body)


def _parse_header(header: str | None) -> _SignatureHeader:
    """Parse ``t=<unix seconds>,v1=<hex>[,v1=<hex>...]``, ignoring unknown schemes such as v0."""
    if header is None or not header.strip():
        raise WebhookSignatureError(WebhookSignatureFailure.MISSING_HEADER)
    timestamp: str | None = None
    signatures: list[str] = []
    for element in header.split(_ELEMENT_SEPARATOR):
        key, separator, value = element.partition(_KEY_VALUE_SEPARATOR)
        key, value = key.strip(), value.strip()
        if not separator or not key:
            raise WebhookSignatureError(WebhookSignatureFailure.MALFORMED_HEADER)
        if key == _TIMESTAMP_KEY:
            timestamp = value
        elif key == _SIGNATURE_SCHEME_V1:
            signatures.append(value)
    return _SignatureHeader(_require_timestamp(timestamp), _require_signatures(signatures))


def _require_timestamp(timestamp: str | None) -> str:
    if timestamp is None:
        raise WebhookSignatureError(WebhookSignatureFailure.MISSING_TIMESTAMP)
    if not _UNIX_TIMESTAMP_PATTERN.fullmatch(timestamp):
        raise WebhookSignatureError(WebhookSignatureFailure.INVALID_TIMESTAMP)
    return timestamp


def _require_signatures(signatures: list[str]) -> tuple[str, ...]:
    if not signatures:
        raise WebhookSignatureError(WebhookSignatureFailure.MISSING_SIGNATURE)
    return tuple(signatures)


def _check_tolerance(timestamp: int, now: float, tolerance: int) -> None:
    if abs(int(now) - timestamp) > tolerance:
        raise WebhookSignatureError(WebhookSignatureFailure.TIMESTAMP_OUTSIDE_TOLERANCE)


def _signatures_match(expected: str, received: str) -> bool:
    """Compare in constant time. Bytes, because ``compare_digest`` rejects non-ASCII strings."""
    return hmac.compare_digest(expected.encode(_ENCODING), received.encode(_ENCODING))


def _parse_event(body: bytes) -> WebhookEvent:
    try:
        event = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise WebhookSignatureError(WebhookSignatureFailure.INVALID_PAYLOAD) from error
    if not isinstance(event, dict):
        raise WebhookSignatureError(WebhookSignatureFailure.INVALID_PAYLOAD)
    return cast("WebhookEvent", event)
