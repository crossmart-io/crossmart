from __future__ import annotations

import hashlib
import hmac
import json

import pytest

from crossmart import (
    CrossmartError,
    WebhookEventType,
    WebhookSignatureError,
    WebhookSignatureFailure,
    verify_webhook_signature,
)

SECRET = "whsec_test_secret"
OLD_SECRET = "whsec_old_secret"
NOW = 1_793_966_400
PAYLOAD = json.dumps(
    {
        "id": "0f8b2a52-5d4e-4c3a-9b1e-7c6d5e4f3a2b",
        "type": "order.created",
        "createdAt": "2026-11-06T12:00:00.000Z",
        "workspaceId": "6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d",
        "apiVersion": "v1",
        "data": {"orderId": "ord_1", "total": "19.99"},
    }
)


def sign(payload: str, secret: str = SECRET, timestamp: int = NOW) -> str:
    signed = f"{timestamp}.{payload}".encode()
    return hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()


def header(*signatures: str, timestamp: int = NOW) -> str:
    return ",".join([f"t={timestamp}", *(f"v1={signature}" for signature in signatures)])


def failure(
    payload: bytes | str, signature_header: str | None, **options: int
) -> WebhookSignatureFailure:
    with pytest.raises(WebhookSignatureError) as caught:
        verify_webhook_signature(payload, signature_header, SECRET, now=NOW, **options)
    return caught.value.reason


def test_returns_the_event_when_the_signature_matches() -> None:
    event = verify_webhook_signature(PAYLOAD, header(sign(PAYLOAD)), SECRET, now=NOW)

    assert event["type"] == WebhookEventType.ORDER_CREATED
    assert event["data"] == {"orderId": "ord_1", "total": "19.99"}


def test_accepts_a_bytes_payload() -> None:
    event = verify_webhook_signature(PAYLOAD.encode(), header(sign(PAYLOAD)), SECRET, now=NOW)

    assert event["apiVersion"] == "v1"


@pytest.mark.parametrize("old_first", [True, False])
def test_accepts_either_signature_during_a_rotation(old_first: bool) -> None:
    signatures = [sign(PAYLOAD, OLD_SECRET), sign(PAYLOAD)]
    if not old_first:
        signatures.reverse()

    event = verify_webhook_signature(PAYLOAD, header(*signatures), SECRET, now=NOW)

    assert event["id"] == "0f8b2a52-5d4e-4c3a-9b1e-7c6d5e4f3a2b"


def test_ignores_unknown_schemes_and_whitespace() -> None:
    signature_header = f"t={NOW}, v0=abc, v1={sign(PAYLOAD)}"

    assert verify_webhook_signature(PAYLOAD, signature_header, SECRET, now=NOW)


def test_rejects_a_tampered_body() -> None:
    tampered = PAYLOAD.replace("19.99", "0.01")

    assert failure(tampered, header(sign(PAYLOAD))) is WebhookSignatureFailure.SIGNATURE_MISMATCH


def test_rejects_another_secret_without_revealing_the_secret() -> None:
    with pytest.raises(WebhookSignatureError) as caught:
        verify_webhook_signature(PAYLOAD, header(sign(PAYLOAD, OLD_SECRET)), SECRET, now=NOW)

    assert isinstance(caught.value, CrossmartError)
    assert caught.value.reason is WebhookSignatureFailure.SIGNATURE_MISMATCH
    assert SECRET not in str(caught.value)


def test_rejects_a_header_timestamp_that_was_not_signed() -> None:
    signature_header = header(sign(PAYLOAD), timestamp=NOW + 1)

    assert failure(PAYLOAD, signature_header) is WebhookSignatureFailure.SIGNATURE_MISMATCH


@pytest.mark.parametrize("timestamp", [NOW - 301, NOW + 301])
def test_rejects_a_timestamp_beyond_the_tolerance(timestamp: int) -> None:
    signature_header = header(sign(PAYLOAD, timestamp=timestamp), timestamp=timestamp)

    assert failure(PAYLOAD, signature_header) is WebhookSignatureFailure.TIMESTAMP_OUTSIDE_TOLERANCE


def test_accepts_a_timestamp_at_the_edge_of_the_tolerance() -> None:
    timestamp = NOW - 300
    signature_header = header(sign(PAYLOAD, timestamp=timestamp), timestamp=timestamp)

    assert verify_webhook_signature(PAYLOAD, signature_header, SECRET, now=NOW)


def test_honours_a_custom_tolerance() -> None:
    timestamp = NOW - 60
    signature_header = header(sign(PAYLOAD, timestamp=timestamp), timestamp=timestamp)

    reason = failure(PAYLOAD, signature_header, tolerance=30)

    assert reason is WebhookSignatureFailure.TIMESTAMP_OUTSIDE_TOLERANCE


def test_uses_the_system_clock_by_default() -> None:
    with pytest.raises(WebhookSignatureError) as caught:
        verify_webhook_signature(PAYLOAD, header(sign(PAYLOAD, timestamp=1), timestamp=1), SECRET)

    assert caught.value.reason is WebhookSignatureFailure.TIMESTAMP_OUTSIDE_TOLERANCE


@pytest.mark.parametrize(
    ("signature_header", "reason"),
    [
        (None, WebhookSignatureFailure.MISSING_HEADER),
        ("", WebhookSignatureFailure.MISSING_HEADER),
        ("garbage", WebhookSignatureFailure.MALFORMED_HEADER),
        ("=abc", WebhookSignatureFailure.MALFORMED_HEADER),
        ("v1=abc", WebhookSignatureFailure.MISSING_TIMESTAMP),
        ("t=12.5,v1=abc", WebhookSignatureFailure.INVALID_TIMESTAMP),
        ("t=abc,v1=abc", WebhookSignatureFailure.INVALID_TIMESTAMP),
        ("t=-1,v1=abc", WebhookSignatureFailure.INVALID_TIMESTAMP),
        ("t=١٢٣,v1=abc", WebhookSignatureFailure.INVALID_TIMESTAMP),
        (f"t={NOW}", WebhookSignatureFailure.MISSING_SIGNATURE),
        (f"t={NOW},v0=abc", WebhookSignatureFailure.MISSING_SIGNATURE),
        (f"t={NOW},v1=not-hex-é", WebhookSignatureFailure.SIGNATURE_MISMATCH),
    ],
)
def test_rejects_malformed_headers(
    signature_header: str | None, reason: WebhookSignatureFailure
) -> None:
    assert failure(PAYLOAD, signature_header) is reason


def test_rejects_a_signed_payload_that_is_not_a_json_object() -> None:
    payload = "[1, 2]"

    assert failure(payload, header(sign(payload))) is WebhookSignatureFailure.INVALID_PAYLOAD
