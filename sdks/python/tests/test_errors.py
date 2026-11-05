from __future__ import annotations

import httpx
import pytest
import respx

from crossmart import (
    AuthenticationError,
    BadRequestError,
    ConflictError,
    Crossmart,
    CrossmartAPIError,
    CrossmartConnectionError,
    NotFoundError,
    PermissionDeniedError,
    PlanLimitError,
    ServerError,
)
from crossmart.models import EntitlementErrorCode

from .conftest import PRODUCT_ID, STORE_ID, WORKSPACE_PATH

PRODUCT_PATH = f"{WORKSPACE_PATH}/products/{PRODUCT_ID}"


@pytest.mark.parametrize(
    ("status", "error_class"),
    [
        (400, BadRequestError),
        (401, AuthenticationError),
        (403, PermissionDeniedError),
        (404, NotFoundError),
        (409, ConflictError),
        (418, CrossmartAPIError),
    ],
)
def test_maps_error_statuses_to_exceptions(
    api: respx.MockRouter, client: Crossmart, status: int, error_class: type[CrossmartAPIError]
) -> None:
    api.get(PRODUCT_PATH).respond(
        status, json={"statusCode": status, "message": "Nope", "error": "X"}
    )

    with pytest.raises(error_class) as raised:
        client.products.get(PRODUCT_ID)

    assert type(raised.value) is error_class
    assert raised.value.status == status
    assert raised.value.message == "Nope"
    assert raised.value.error == "X"


def test_joins_validation_messages(api: respx.MockRouter, client: Crossmart) -> None:
    api.post(f"{WORKSPACE_PATH}/products").respond(
        400,
        json={
            "statusCode": 400,
            "message": ["title should not be empty", "variants must be an array"],
            "error": "Bad Request",
        },
    )

    with pytest.raises(BadRequestError) as raised:
        client.products.create({"title": "", "variants": []})

    assert raised.value.message == "title should not be empty; variants must be an array"
    assert str(raised.value) == f"400 {raised.value.message}"


def test_exposes_plan_limit_details(api: respx.MockRouter, client: Crossmart) -> None:
    api.post(f"{WORKSPACE_PATH}/products/{PRODUCT_ID}/channels/{STORE_ID}").respond(
        402,
        json={
            "statusCode": 402,
            "error": "Payment Required",
            "code": "plan_limit_reached",
            "message": "Your plan allows 100 active listings.",
            "feature": "active_listings",
            "plan": "starter",
            "limit": 100,
            "usage": 100,
            "requested": 1,
        },
    )

    with pytest.raises(PlanLimitError) as raised:
        client.listings.publish(PRODUCT_ID, STORE_ID)

    error = raised.value
    assert error.code == EntitlementErrorCode.PLAN_LIMIT_REACHED
    assert (error.feature, error.plan, error.limit, error.usage) == (
        "active_listings",
        "starter",
        100,
        100,
    )


def test_uses_the_body_text_when_it_is_not_json(api: respx.MockRouter, client: Crossmart) -> None:
    api.post(f"{WORKSPACE_PATH}/ai/content-drafts").respond(502, text="Bad gateway from proxy")

    with pytest.raises(ServerError) as raised:
        client.ai.draft_content({"productId": PRODUCT_ID, "fields": ["title"]})

    assert raised.value.message == "Bad gateway from proxy"
    assert raised.value.body is None
    assert raised.value.code is None


def test_falls_back_to_the_reason_phrase(api: respx.MockRouter, client: Crossmart) -> None:
    api.delete(PRODUCT_PATH).respond(404)

    with pytest.raises(NotFoundError, match="Not Found"):
        client.products.delete(PRODUCT_ID)


def test_wraps_connection_failures(api: respx.MockRouter, client: Crossmart) -> None:
    api.post(f"{WORKSPACE_PATH}/products").mock(side_effect=httpx.ConnectError("refused"))

    with pytest.raises(CrossmartConnectionError, match="refused"):
        client.products.create({"title": "Mug", "variants": [{"price": "9.00"}]})
