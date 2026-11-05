from __future__ import annotations

from datetime import UTC, datetime, timedelta
from email.utils import format_datetime

import httpx
import pytest
import respx

from crossmart import AsyncCrossmart, Crossmart, RateLimitError, RetryPolicy, ServerError
from crossmart._constants import MAX_RETRY_AFTER_SECONDS

from .conftest import API_KEY, BASE_URL, PRODUCT_ID, WORKSPACE_ID, WORKSPACE_PATH, fixture

PRODUCT_PATH = f"{WORKSPACE_PATH}/products/{PRODUCT_ID}"


def test_retries_a_get_after_a_server_error(
    api: respx.MockRouter, client: Crossmart, sleeps: list[float]
) -> None:
    route = api.get(PRODUCT_PATH)
    route.side_effect = [httpx.Response(503), httpx.Response(200, json=fixture("ProductDto"))]

    product = client.products.get(PRODUCT_ID)

    assert product.title == "sample"
    assert route.call_count == 2
    assert len(sleeps) == 1


def test_waits_as_long_as_retry_after_asks(
    api: respx.MockRouter, client: Crossmart, sleeps: list[float]
) -> None:
    route = api.get(PRODUCT_PATH)
    route.side_effect = [
        httpx.Response(429, headers={"Retry-After": "3"}),
        httpx.Response(200, json=fixture("ProductDto")),
    ]

    client.products.get(PRODUCT_ID)

    assert sleeps == [3.0]


def test_reads_retry_after_as_an_http_date(
    api: respx.MockRouter, client: Crossmart, sleeps: list[float]
) -> None:
    retry_at = datetime.now(UTC) + timedelta(seconds=30)
    route = api.get(PRODUCT_PATH)
    route.side_effect = [
        httpx.Response(429, headers={"Retry-After": format_datetime(retry_at, usegmt=True)}),
        httpx.Response(200, json=fixture("ProductDto")),
    ]

    client.products.get(PRODUCT_ID)

    assert 25 < sleeps[0] <= 30


def test_caps_a_long_retry_after(
    api: respx.MockRouter, client: Crossmart, sleeps: list[float]
) -> None:
    route = api.get(PRODUCT_PATH)
    route.side_effect = [
        httpx.Response(429, headers={"Retry-After": "3600"}),
        httpx.Response(200, json=fixture("ProductDto")),
    ]

    client.products.get(PRODUCT_ID)

    assert sleeps == [MAX_RETRY_AFTER_SECONDS]


def test_raises_once_retries_run_out(
    api: respx.MockRouter, client: Crossmart, sleeps: list[float]
) -> None:
    route = api.get(PRODUCT_PATH).respond(429, json={"statusCode": 429, "message": "Slow down"})

    with pytest.raises(RateLimitError):
        client.products.get(PRODUCT_ID)

    assert route.call_count == 3
    assert len(sleeps) == 2


def test_never_retries_a_post(
    api: respx.MockRouter, client: Crossmart, sleeps: list[float]
) -> None:
    route = api.post(f"{WORKSPACE_PATH}/products").respond(503)

    with pytest.raises(ServerError):
        client.products.create({"title": "Mug", "variants": [{"price": "9.00"}]})

    assert route.call_count == 1
    assert sleeps == []


def test_retries_a_put(api: respx.MockRouter, client: Crossmart) -> None:
    route = api.put(PRODUCT_PATH)
    route.side_effect = [httpx.Response(500), httpx.Response(200, json=fixture("ProductDto"))]

    client.products.update(PRODUCT_ID, {"title": "Mug", "handle": "mug", "variants": []})

    assert route.call_count == 2


def test_does_not_retry_a_client_error(api: respx.MockRouter, client: Crossmart) -> None:
    route = api.get(PRODUCT_PATH).respond(404)

    with pytest.raises(Exception, match="Not Found"):
        client.products.get(PRODUCT_ID)

    assert route.call_count == 1


def test_retries_a_refused_connection(
    api: respx.MockRouter, client: Crossmart, sleeps: list[float]
) -> None:
    route = api.get(PRODUCT_PATH)
    route.side_effect = [
        httpx.ConnectError("refused"),
        httpx.Response(200, json=fixture("ProductDto")),
    ]

    client.products.get(PRODUCT_ID)

    assert route.call_count == 2


def test_can_be_turned_off(api: respx.MockRouter, sleeps: list[float]) -> None:
    route = api.get(PRODUCT_PATH).respond(503)

    with (
        Crossmart(
            api_key=API_KEY, base_url=BASE_URL, workspace_id=WORKSPACE_ID, max_retries=0
        ) as client,
        pytest.raises(ServerError),
    ):
        client.products.get(PRODUCT_ID)

    assert route.call_count == 1


def test_backs_off_exponentially_up_to_a_cap() -> None:
    policy = RetryPolicy(initial_backoff=1.0, max_backoff=4.0)

    delays = [policy.delay(attempt) for attempt in range(1, 6)]

    assert 0.75 <= delays[0] <= 1.0
    assert 1.5 <= delays[1] <= 2.0
    assert all(3.0 <= delay <= 4.0 for delay in delays[2:])


@pytest.mark.anyio
async def test_retries_asynchronous_requests(
    api: respx.MockRouter, async_client: AsyncCrossmart, sleeps: list[float]
) -> None:
    route = api.get(PRODUCT_PATH)
    route.side_effect = [
        httpx.Response(503, headers={"Retry-After": "1"}),
        httpx.Response(200, json=fixture("ProductDto")),
    ]

    async with async_client:
        await async_client.products.get(PRODUCT_ID)

    assert route.call_count == 2
    assert sleeps == [1.0]
